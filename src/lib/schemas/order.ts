import { z } from 'zod';
import { checkout } from '@/content/checkout';

const e = checkout.errors;

export const PAYMENT_METHODS = ['cod', 'transfer'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/** Bỏ dấu cách, dấu chấm, gạch ngang, ngoặc: "0912.345.678" → "0912345678". */
export function normalizePhone(raw: string): string {
  return raw.replace(/[\s.\-()]/g, '');
}

/** Số điện thoại Việt Nam trong nước: 10 chữ số, bắt đầu bằng 0 (di động 03/05/07/08/09, bàn 02). */
const PHONE_RE = /^0\d{9}$/;
export const isValidPhone = (raw: string): boolean => PHONE_RE.test(normalizePhone(raw));

const pad = (n: number) => String(n).padStart(2, '0');

/** yyyy-mm-dd theo giờ địa phương. */
export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Ngày sớm nhất được chọn: ngày mai (giờ địa phương). */
export function earliestDeliveryDate(now: Date = new Date()): string {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return toISODate(d);
}

/** yyyy-mm-dd có phải ngày lịch có thật (không phải 2026-02-30). */
export function isRealISODate(value: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(y, mo - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d;
}

/** Trường đầu vào của form là chuỗi; rỗng ở mục không bắt buộc → undefined sau khi parse. */
const optional = (s: string) => (s === '' ? undefined : s);

/**
 * Schema form khách hàng (dùng chung client và, sau này, server/Apps Script). `now` để test ngày.
 * Đầu vào: chuỗi thô từ form. Đầu ra: giá trị đã chuẩn hoá (trim, số điện thoại 10 chữ số).
 */
export function createCustomerSchema(now: Date = new Date()) {
  const earliest = earliestDeliveryDate(now);
  return z.object({
    name: z.string().trim().min(1, e.nameRequired).max(80, e.nameTooLong),
    phone: z
      .string()
      .trim()
      .min(1, e.phoneRequired)
      .refine(isValidPhone, e.phoneInvalid)
      .transform(normalizePhone),
    email: z
      .string()
      .trim()
      .refine((v) => v === '' || z.email().safeParse(v).success, e.emailInvalid)
      .transform(optional),
    address: z.string().trim().min(1, e.addressRequired).max(200, e.addressTooLong),
    province: z.string().trim().min(1, e.provinceRequired).max(60, e.provinceTooLong),
    desiredDate: z
      .string()
      .trim()
      .superRefine((v, ctx) => {
        if (v === '') return;
        if (!isRealISODate(v)) ctx.addIssue({ code: 'custom', message: e.dateInvalid });
        else if (v < earliest) ctx.addIssue({ code: 'custom', message: e.datePast });
      })
      .transform(optional),
    note: z.string().trim().max(500, e.noteTooLong).transform(optional),
    payment: z.enum(PAYMENT_METHODS, { error: e.paymentRequired }),
  });
}

export type CustomerInput = z.input<ReturnType<typeof createCustomerSchema>>;
export type Customer = z.output<ReturnType<typeof createCustomerSchema>>;

/** Dữ liệu đơn gửi đi (xem docs/ORDER-PAYLOAD.md). Mọi giá VND, số nguyên. */
export const orderPayloadSchema = z.object({
  version: z.literal(1),
  /** ISO 8601 (UTC), thời điểm khách bấm gửi. */
  createdAt: z.iso.datetime(),
  customer: z.object({
    name: z.string().min(1),
    phone: z.string().regex(PHONE_RE),
    email: z.string().optional(),
    address: z.string().min(1),
    province: z.string().min(1),
    desiredDate: z.string().optional(),
    note: z.string().optional(),
    payment: z.enum(PAYMENT_METHODS),
  }),
  box: z.object({
    size: z.number().int().positive(),
    /** Id viên theo thứ tự ô (trái → phải, trên → dưới). */
    slots: z.array(z.string().min(1)),
    items: z.array(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1),
        qty: z.number().int().positive(),
        unitPrice: z.number().int().nonnegative(),
      }),
    ),
  }),
  card: z.object({
    message: z.string().max(150),
    from: z.string().max(40),
    to: z.string().max(40),
  }),
  pricing: z.object({
    box: z.number().int().nonnegative(),
    pieces: z.number().int().nonnegative(),
    total: z.number().int().nonnegative(),
  }),
});

export type OrderPayload = z.infer<typeof orderPayloadSchema>;
