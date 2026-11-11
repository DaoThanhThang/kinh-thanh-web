import type { BoxOption } from '@/lib/schemas/box';
import type { Chocolate } from '@/lib/schemas/chocolate';

export const choc = (id: string, price: number, available = true): Chocolate => ({
  id,
  name: `Chocolate ${id}`,
  price,
  image: `/chocolates/${id}.svg`,
  description: '',
  flavorNotes: [],
  allergens: null,
  available,
  sortOrder: Number(id),
});

export const CHOCOLATES: Chocolate[] = [
  choc('01', 35000),
  choc('02', 40000),
  choc('03', 45000),
  choc('04', 50000, false),
];

export const box = (size: number, cols: number, rows: number, price: number): BoxOption => ({
  size,
  cols,
  rows,
  price,
  name: `Hộp ${size}`,
});

export const BOXES: BoxOption[] = [
  box(6, 3, 2, 120000),
  box(9, 3, 3, 150000),
  box(12, 4, 3, 180000),
];

/** rng tuần hoàn qua dãy cho trước. */
export const seq = (...values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length] ?? 0;
};
