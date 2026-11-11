import { describe, expect, it } from 'vitest';
import { boxSchema } from '../box';
import { chocolateSchema } from '../chocolate';

const choc = {
  id: '01',
  name: 'Chocolate 01',
  price: 35000,
  image: '/chocolates/01.svg',
  description: 'x',
  flavorNotes: [],
  allergens: null,
};

describe('chocolateSchema', () => {
  it('chấp nhận viên hợp lệ và điền mặc định', () => {
    const r = chocolateSchema.parse(choc);
    expect(r.available).toBe(true);
    expect(r.sortOrder).toBe(0);
    expect(r.allergens).toBeNull();
  });
  it('chấp nhận allergens rỗng (đã xác nhận không có)', () => {
    expect(chocolateSchema.parse({ ...choc, allergens: [] }).allergens).toEqual([]);
  });
  it.each([
    ['giá âm', { price: -1 }],
    ['giá lẻ', { price: 100.5 }],
    ['thiếu tên', { name: '' }],
    ['đường dẫn ảnh sai', { image: 'chocolates/01.svg' }],
  ])('từ chối %s', (_label, patch) => {
    expect(chocolateSchema.safeParse({ ...choc, ...patch }).success).toBe(false);
  });
  it('từ chối khi thiếu hẳn name', () => {
    const rest: Record<string, unknown> = { ...choc };
    delete rest.name;
    expect(chocolateSchema.safeParse(rest).success).toBe(false);
  });
});

describe('boxSchema', () => {
  const box = { size: 12, cols: 4, rows: 3, price: 180000, name: 'Hộp 12 viên' };
  it('chấp nhận hộp hợp lệ', () => {
    expect(boxSchema.safeParse(box).success).toBe(true);
  });
  it('từ chối cols*rows khác size', () => {
    expect(boxSchema.safeParse({ ...box, rows: 4 }).success).toBe(false);
  });
});
