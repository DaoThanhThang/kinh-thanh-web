import { z } from 'zod';

/** Một viên chocolate trong data/chocolates.json. `allergens: null` = chưa có thông tin (khác với [] = đã xác nhận không có). */
export const chocolateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  price: z.number().int().positive(),
  image: z.string().refine((s) => s.startsWith('/') || s.startsWith('http'), {
    message: 'image phải bắt đầu bằng "/" hoặc "http"',
  }),
  description: z.string(),
  flavorNotes: z.array(z.string()),
  allergens: z.array(z.string()).nullable(),
  available: z.boolean().default(true),
  sortOrder: z.number().default(0),
});

export type Chocolate = z.infer<typeof chocolateSchema>;
