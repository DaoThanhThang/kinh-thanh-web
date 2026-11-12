import { z } from 'zod';
import { CHAT_LIMITS } from '@/content/chat';

/** Thân yêu cầu tối đa (byte): 16 tin × 2000 ký tự × tối đa 4 byte, cộng dư địa. */
export const CHAT_BODY_MAX_BYTES = 160 * 1024;

const userMessage = z.object({
  role: z.literal('user'),
  content: z.string().trim().min(1).max(CHAT_LIMITS.userMax),
});
const assistantMessage = z.object({
  role: z.literal('assistant'),
  content: z.string().trim().min(1).max(CHAT_LIMITS.assistantMax),
});

export const chatRequestSchema = z.object({
  messages: z
    .array(z.discriminatedUnion('role', [userMessage, assistantMessage]))
    .min(1)
    .max(CHAT_LIMITS.maxMessages)
    .refine((m) => m[m.length - 1]?.role === 'user', { message: 'tin cuối phải của người dùng' }),
  boxContext: z
    .object({
      size: z.number().int().min(1).max(64),
      filledIds: z.array(z.string().max(32)).max(64),
    })
    .optional(),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;
