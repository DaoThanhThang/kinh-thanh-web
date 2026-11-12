import { checkout } from '@/content/checkout';
import type { BoxOption } from '@/lib/schemas/box';
import type { Chocolate } from '@/lib/schemas/chocolate';
import type { ValidatedOrderRequest } from '@/lib/schemas/order';
import type { OrderCell, OrderLine, OrderRecord } from './types';

export type BuildOrderResult = { ok: true; order: OrderRecord } | { ok: false; error: string };

/**
 * Dựng đơn từ yêu cầu đã kiểm hình dạng. Tên, giá, ảnh viên và giá hộp đều lấy từ catalog (không
 * tin client). Hộp phải đủ viên, mọi id phải có trong catalog và đang bán.
 */
export function buildOrderRecord(args: {
  request: ValidatedOrderRequest;
  chocolates: readonly Chocolate[];
  boxes: readonly BoxOption[];
  orderId: string;
  now: Date;
}): BuildOrderResult {
  const { request, chocolates, boxes, orderId, now } = args;
  const s = checkout.serverErrors;
  const box = boxes.find((b) => b.size === request.box.size);
  if (!box) return { ok: false, error: s.boxSize };

  const { slots } = request.box;
  if (slots.length !== box.size || slots.some((id) => id === null || id === '')) {
    return { ok: false, error: s.boxNotFull };
  }

  const byId = new Map(chocolates.map((c) => [c.id, c]));
  const cells: OrderCell[] = [];
  const counts = new Map<string, number>();
  for (const [i, id] of slots.entries()) {
    const choc = id === null ? undefined : byId.get(id);
    if (!choc) return { ok: false, error: s.unknownPiece(String(id).slice(0, 12)) };
    if (!choc.available) return { ok: false, error: s.unavailablePiece(choc.name) };
    cells.push({ n: i + 1, id: choc.id, name: choc.name, image: choc.image });
    counts.set(choc.id, (counts.get(choc.id) ?? 0) + 1);
  }

  const lines: OrderLine[] = chocolates
    .filter((c) => counts.has(c.id))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id))
    .map((c) => {
      const qty = counts.get(c.id) ?? 0;
      return { id: c.id, name: c.name, qty, unitPrice: c.price, lineTotal: qty * c.price };
    });
  const pieces = lines.reduce((sum, l) => sum + l.lineTotal, 0);

  const { customer } = request;
  const customerOut: OrderRecord['customer'] = { name: customer.name, phone: customer.phone };
  if (customer.email) customerOut.email = customer.email;
  const delivery: OrderRecord['delivery'] = {
    address: customer.address,
    province: customer.province,
  };
  if (customer.desiredDate) delivery.desiredDate = customer.desiredDate;
  if (customer.note) delivery.note = customer.note;

  return {
    ok: true,
    order: {
      orderId,
      createdAt: now,
      customer: customerOut,
      delivery,
      payment: customer.payment,
      box: { size: box.size, cols: box.cols, rows: box.rows, name: box.name, price: box.price },
      cells,
      lines,
      card: request.card,
      pricing: { box: box.price, pieces, total: box.price + pieces },
    },
  };
}
