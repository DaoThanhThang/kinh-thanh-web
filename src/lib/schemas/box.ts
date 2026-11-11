import { z } from 'zod';

/** Một cỡ hộp trong data/boxes.json. Bất biến: cols * rows === size. */
export const boxSchema = z
  .object({
    size: z.number().int().positive(),
    cols: z.number().int().positive(),
    rows: z.number().int().positive(),
    price: z.number().int().positive(),
    name: z.string(),
  })
  .refine((b) => b.cols * b.rows === b.size, {
    message: 'cols * rows phải bằng size',
    path: ['size'],
  });

export type BoxOption = z.infer<typeof boxSchema>;
