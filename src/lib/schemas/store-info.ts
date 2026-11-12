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
    /** Các bước từ đặt hàng đến nhận hàng (trang /thong-tin vẽ thành đường quy trình). */
    steps: z.array(z.object({ title: nonEmpty, text: text.default('') })).default([]),
    /** Thời gian giao theo khu vực (bảng trên /thong-tin). */
    zones: z
      .array(z.object({ area: nonEmpty, leadTime: nonEmpty, note: text.default('') }))
      .default([]),
  }),
  returns: z.object({
    /** Tóm tắt một đoạn (chatbot và nơi không đủ chỗ cho danh sách). */
    policy: text,
    eligible: z.array(nonEmpty).default([]),
    howTo: z.array(nonEmpty).default([]),
    exclusions: z.array(nonEmpty).default([]),
  }),
  storage: z.object({
    tips: z.array(nonEmpty),
    /** Khoảng nhiệt độ khuyên dùng (°C), dùng vẽ thang đo. */
    range: z
      .object({ min: z.number(), max: z.number() })
      .refine((r) => r.min < r.max, { message: 'range.min phải nhỏ hơn range.max' })
      .default({ min: 16, max: 18 }),
    /** Câu ghi chú thời gian dùng ngon nhất, ví dụ "Ngon nhất trong 2–3 tuần". */
    shelfLife: text.default(''),
    do: z.array(nonEmpty).default([]),
    avoid: z.array(nonEmpty).default([]),
    /** Gợi ý thưởng thức (chung, không nêu công dụng sức khoẻ). */
    enjoy: z.array(nonEmpty).default([]),
  }),
  faq: z.array(
    z.object({
      question: nonEmpty,
      answer: nonEmpty,
      /** Tên nhóm hiển thị; bỏ trống thì câu hỏi nằm ở nhóm cuối không tiêu đề. */
      group: text.default(''),
    }),
  ),
});

export type StoreInfo = z.infer<typeof storeInfoSchema>;
