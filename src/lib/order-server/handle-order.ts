import { checkout } from '@/content/checkout';
import { ORDER_BODY_MAX_BYTES, parseOrderRequest } from '@/lib/schemas/order';
import type { BoxOption } from '@/lib/schemas/box';
import type { Chocolate } from '@/lib/schemas/chocolate';
import { renderTrayPng } from '@/lib/order-email/tray-image';
import { sendOrderEmails } from '@/lib/order-email/mailer';
import { getBoxOptions, getChocolates } from '@/lib/services/catalog';
import { buildOrderRecord } from './build-order';
import { generateServerOrderId } from './order-id';
import { createRateLimiter, type RateLimiter } from './rate-limit';
import type { OrderRecord } from './types';

/** 5 đơn / 10 phút / IP. Xem ghi chú giới hạn của bộ nhớ tiến trình ở rate-limit.ts. */
export const orderRateLimiter: RateLimiter = createRateLimiter({
  max: 5,
  windowMs: 10 * 60 * 1000,
});

export type OrderDeps = {
  limiter: RateLimiter;
  getCatalog: () => Promise<{ chocolates: Chocolate[]; boxes: BoxOption[] }>;
  sendEmails: (order: OrderRecord, tray: Buffer) => Promise<unknown>;
  now: () => Date;
};

export const defaultOrderDeps: OrderDeps = {
  limiter: orderRateLimiter,
  getCatalog: async () => {
    const [chocolates, boxes] = await Promise.all([getChocolates(), getBoxOptions()]);
    return { chocolates, boxes };
  },
  sendEmails: (order, tray) => sendOrderEmails(order, tray),
  now: () => new Date(),
};

const json = (
  body: { ok: true; orderId: string } | { ok: false; error: string },
  status = 200,
  headers?: HeadersInit,
) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store', ...headers } });

const fail = (error: string, status: number, headers?: HeadersInit) =>
  json({ ok: false, error }, status, headers);

/**
 * IP khách. Trên Vercel `x-forwarded-for` do nền tảng đặt (không giả mạo được từ client);
 * ở nơi khác header này có thể bị client tự đặt, chấp nhận vì đây chỉ là biện pháp răn đe.
 */
export function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return xff || req.headers.get('x-real-ip')?.trim() || 'unknown';
}

/** Đọc thân yêu cầu nhưng dừng ngay khi vượt giới hạn (không nạp cả thân khổng lồ vào bộ nhớ). */
export async function readBodyLimited(req: Request, maxBytes: number): Promise<string | null> {
  const declared = Number(req.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > maxBytes) return null;
  if (!req.body) return '';
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => {});
      return null;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString('utf8');
}

export async function handleOrderRequest(
  req: Request,
  deps: OrderDeps = defaultOrderDeps,
): Promise<Response> {
  const s = checkout.serverErrors;

  const limit = deps.limiter.check(clientIp(req));
  if (!limit.allowed) {
    return fail(s.tooManyRequests, 429, { 'Retry-After': String(limit.retryAfterSec) });
  }

  if (!(req.headers.get('content-type') ?? '').toLowerCase().includes('application/json')) {
    return fail(s.unsupportedType, 415);
  }

  const text = await readBodyLimited(req, ORDER_BODY_MAX_BYTES);
  if (text === null) return fail(s.tooLarge, 413);

  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return fail(s.invalidJson, 400);
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return fail(s.invalidData, 400);

  // Honeypot: bot điền ô ẩn. Trả "ok" như thật nhưng không làm gì (không email, không ghi).
  const trap = (raw as { website?: unknown }).website;
  if (typeof trap === 'string' && trap.trim() !== '') {
    return json({ ok: true, orderId: generateServerOrderId(deps.now()) });
  }

  const now = deps.now();
  const parsed = parseOrderRequest(raw, now);
  if (!parsed.ok) return fail(parsed.error, 400);

  const { chocolates, boxes } = await deps.getCatalog();
  const orderId = generateServerOrderId(now);
  const built = buildOrderRecord({ request: parsed.data, chocolates, boxes, orderId, now });
  if (!built.ok) return fail(built.error, 400);
  const { order } = built;

  try {
    const tray = await renderTrayPng({
      cols: order.box.cols,
      rows: order.box.rows,
      images: order.cells.map((c) => c.image),
      caption: `${order.orderId} · ${order.box.name}`,
    });
    await deps.sendEmails(order, tray);
  } catch (err) {
    console.error('[api/order] không gửi được đơn', orderId, err);
    return fail(s.sendFailed, 500);
  }
  return json({ ok: true, orderId });
}
