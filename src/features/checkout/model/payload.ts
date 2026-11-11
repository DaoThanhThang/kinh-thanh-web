import { countById, pricing } from '@/features/box-builder';
import type { BoxOption } from '@/lib/schemas/box';
import type { Chocolate } from '@/lib/schemas/chocolate';
import type { Customer, OrderPayload } from '@/lib/schemas/order';

export type BoxSnapshot = {
  size: number | null;
  slots: (string | null)[];
  message: string;
  from: string;
  to: string;
};

export type PieceLine = { id: string; name: string; qty: number; unitPrice: number };

/** Gom viên theo loại (theo sortOrder của catalog), bỏ id không còn trong catalog. */
export function groupPieces(
  slots: readonly (string | null)[],
  chocolates: readonly Chocolate[],
): PieceLine[] {
  const counts = countById([...slots]);
  return [...chocolates]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .filter((c) => (counts[c.id] ?? 0) > 0)
    .map((c) => ({ id: c.id, name: c.name, qty: counts[c.id] ?? 0, unitPrice: c.price }));
}

/** Hộp đã đủ viên (không còn ô trống, đúng cỡ trong danh mục). */
export function isBoxComplete(box: BoxSnapshot, boxes: readonly BoxOption[]): boolean {
  const opt = boxes.find((b) => b.size === box.size);
  return !!opt && box.slots.length === opt.size && !box.slots.includes(null);
}

/** Dựng payload gửi đi từ hộp trong store + thông tin khách đã chuẩn hoá. */
export function buildOrderPayload(args: {
  customer: Customer;
  box: BoxSnapshot;
  chocolates: readonly Chocolate[];
  boxes: readonly BoxOption[];
  now?: Date;
}): OrderPayload {
  const { customer, box, chocolates, boxes, now = new Date() } = args;
  const price = pricing({ size: box.size, slots: box.slots }, chocolates, boxes);
  const customerOut: OrderPayload['customer'] = {
    name: customer.name,
    phone: customer.phone,
    address: customer.address,
    province: customer.province,
    payment: customer.payment,
  };
  if (customer.email) customerOut.email = customer.email;
  if (customer.desiredDate) customerOut.desiredDate = customer.desiredDate;
  if (customer.note) customerOut.note = customer.note;
  return {
    version: 1,
    createdAt: now.toISOString(),
    customer: customerOut,
    box: {
      size: box.size ?? 0,
      slots: box.slots.filter((s): s is string => s !== null),
      items: groupPieces(box.slots, chocolates),
    },
    card: { message: box.message, from: box.from, to: box.to },
    pricing: { box: price.boxPrice, pieces: price.piecesPrice, total: price.total },
  };
}
