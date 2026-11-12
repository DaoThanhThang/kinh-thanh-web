import { z } from 'zod';
import { info } from '@/content/info';
import { isValidPhone, normalizePhone } from './order';

const e = info.form.errors;

export const MESSAGE_MAX = 1000;

/** Form liên hệ: tên, SĐT hoặc email (một ô), nội dung. Đầu ra đã trim, SĐT chuẩn hoá. */
export const contactSchema = z.object({
  name: z.string().trim().min(1, e.nameRequired).max(80, e.nameTooLong),
  contact: z
    .string()
    .trim()
    .min(1, e.contactRequired)
    .refine((v) => isValidPhone(v) || z.email().safeParse(v).success, e.contactInvalid)
    .transform((v) => (isValidPhone(v) ? normalizePhone(v) : v)),
  message: z.string().trim().min(1, e.messageRequired).max(MESSAGE_MAX, e.messageTooLong),
});

export type ContactInput = z.input<typeof contactSchema>;
export type ContactMessage = z.output<typeof contactSchema> & { createdAt: string };
