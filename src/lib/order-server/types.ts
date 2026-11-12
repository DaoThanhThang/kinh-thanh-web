import type { PaymentMethod } from '@/lib/schemas/order';

/** Một ô trong khay (đánh số từ 1, trái → phải, trên → dưới). */
export type OrderCell = { n: number; id: string; name: string; image: string };

export type OrderLine = {
  id: string;
  name: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
};

/** Đơn đã được máy chủ kiểm và tính lại giá: nguồn dữ liệu duy nhất cho email và ảnh khay. */
export type OrderRecord = {
  orderId: string;
  createdAt: Date;
  customer: { name: string; phone: string; email?: string };
  delivery: { address: string; province: string; desiredDate?: string; note?: string };
  payment: PaymentMethod;
  box: { size: number; cols: number; rows: number; name: string; price: number };
  cells: OrderCell[];
  lines: OrderLine[];
  card: { message: string; to: string; from: string };
  pricing: { box: number; pieces: number; total: number };
};
