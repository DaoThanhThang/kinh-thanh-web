import type { OrderPayload } from '@/lib/schemas/order';

export type OrderResult = { ok: true; orderId: string } | { ok: false; error: string };

/** Cổng gửi đơn. UI chỉ biết interface này; nguồn thật được chọn bởi `createOrderService`. */
export interface OrderService {
  submitOrder(payload: OrderPayload): Promise<OrderResult>;
}

const pad = (n: number, len = 2) => String(n).padStart(len, '0');

/** "KT-" + yyyymmdd (giờ địa phương) + "-" + 4 chữ số ngẫu nhiên, ví dụ KT-20261111-0482. */
export function generateOrderId(
  now: Date = new Date(),
  random: () => number = Math.random,
): string {
  const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const suffix = pad(Math.floor(random() * 10000), 4);
  return `KT-${date}-${suffix}`;
}

export type MockOrderOptions = {
  delayMs?: number;
  now?: () => Date;
  random?: () => number;
  /** Mặc định console.info: đơn chỉ ở trong console, không gửi đi đâu. */
  log?: (...args: unknown[]) => void;
};

/** Giả lập: chờ 900ms, ghi payload ra console, trả mã đơn. Không gọi mạng. */
export class MockOrderService implements OrderService {
  private readonly opts: Required<MockOrderOptions>;

  constructor(opts: MockOrderOptions = {}) {
    this.opts = {
      delayMs: opts.delayMs ?? 900,
      now: opts.now ?? (() => new Date()),
      random: opts.random ?? Math.random,
      log: opts.log ?? ((...args) => console.info(...args)),
    };
  }

  async submitOrder(payload: OrderPayload): Promise<OrderResult> {
    await new Promise((resolve) => setTimeout(resolve, this.opts.delayMs));
    this.opts.log('[MockOrderService] đơn hàng (chỉ ghi ra console)', payload);
    return { ok: true, orderId: generateOrderId(this.opts.now(), this.opts.random) };
  }
}

/**
 * Gửi tới Google Apps Script Web App (T16, chưa bật). POST JSON với Content-Type text/plain để
 * tránh preflight CORS (mẫu chuẩn của Apps Script). Phản hồi mong đợi: `{ ok, orderId?, error? }`.
 */
export class AppsScriptOrderService implements OrderService {
  constructor(
    private readonly endpoint: string,
    private readonly fetchImpl: typeof fetch = (...args) => fetch(...args),
  ) {}

  async submitOrder(payload: OrderPayload): Promise<OrderResult> {
    try {
      const res = await this.fetchImpl(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
        redirect: 'follow',
      });
      if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
      const data: unknown = await res.json();
      if (data && typeof data === 'object') {
        const d = data as { ok?: unknown; orderId?: unknown; error?: unknown };
        if (d.ok === true && typeof d.orderId === 'string' && d.orderId) {
          return { ok: true, orderId: d.orderId };
        }
        return {
          ok: false,
          error: typeof d.error === 'string' ? d.error : 'Phản hồi không hợp lệ',
        };
      }
      return { ok: false, error: 'Phản hồi không hợp lệ' };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Lỗi mạng' };
    }
  }
}

/** Có endpoint → Apps Script, không thì mock. */
export function createOrderService(endpoint?: string | null): OrderService {
  const url = endpoint?.trim();
  return url ? new AppsScriptOrderService(url) : new MockOrderService();
}

/** Dùng ở client. `process.env.NEXT_PUBLIC_*` phải viết nguyên văn để Next thay lúc build. */
export function getOrderService(): OrderService {
  return createOrderService(process.env.NEXT_PUBLIC_ORDER_ENDPOINT);
}
