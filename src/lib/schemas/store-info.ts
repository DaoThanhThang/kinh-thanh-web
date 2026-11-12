import { z } from 'zod';

const text = z.string().trim();
const nonEmpty = text.min(1);

/** Rỗng hoặc chỉ gồm chữ số, dấu cách, dấu chấm (dùng để dựng liên kết Zalo từ các chữ số). */
const zaloField = text.refine((v) => v === '' || /^[\d\s.]+$/.test(v), {
  message: 'zalo chỉ gồm chữ số, dấu cách hoặc dấu chấm',
});

const emailField = text.refine((v) => v === '' || z.email().safeParse(v).success, {
  message: 'email không hợp lệ',
});

const urlField = text.refine((v) => v === '' || /^https?:\/\/\S+$/.test(v), {
  message: 'facebook phải để trống hoặc bắt đầu bằng http(s)://',
});

/**
 * data/store-info.json: thông tin cửa hàng dùng cho footer, /lien-he, /thong-tin và (sau này)
 * chatbot. `placeholder: true` = nội dung tạm, giao diện hiện dòng "đang được cập nhật".
 * Trường chuỗi để rỗng nghĩa là chưa có (giao diện ẩn mục đó).
 */
export const storeInfoSchema = z.object({
  placeholder: z.boolean(),
  contact: z.object({
    phone: text,
    email: emailField,
    address: text,
    hours: text,
    zalo: zaloField,
    facebook: urlField,
  }),
  shipping: z.object({
    areas: z.array(nonEmpty),
    leadTime: text,
    fee: text,
    packaging: text,
  }),
  returns: z.object({ policy: text }),
  storage: z.object({ tips: z.array(nonEmpty) }),
  faq: z.array(z.object({ question: nonEmpty, answer: nonEmpty })),
});

export type StoreInfo = z.infer<typeof storeInfoSchema>;
