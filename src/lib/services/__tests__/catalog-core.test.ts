import { describe, expect, it } from 'vitest';
import { FALLBACK_IMAGE, normalizeBoxes, normalizeChocolates } from '../catalog-core';

const item = (id: string, over: Record<string, unknown> = {}) => ({
  id,
  name: `Chocolate ${id}`,
  price: 40000,
  image: `/chocolates/${id}.svg`,
  description: '',
  flavorNotes: [],
  allergens: null,
  available: true,
  sortOrder: Number(id),
  ...over,
});

const run = (raw: unknown, exists = () => true) => {
  const warnings: string[] = [];
  const list = normalizeChocolates(raw, { exists, warn: (m) => warnings.push(m) });
  return { list, warnings };
};

describe('normalizeChocolates', () => {
  it('bỏ viên lỗi và báo file, vị trí, id, đường dẫn lỗi', () => {
    const { list, warnings } = run([item('01'), item('02', { price: -5 })]);
    expect(list.map((c) => c.id)).toEqual(['01']);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('data/chocolates.json[1]');
    expect(warnings[0]).toContain('id=02');
    expect(warnings[0]).toContain('price');
  });
  it('bỏ id trùng, giữ viên đầu', () => {
    const { list, warnings } = run([item('01', { name: 'A' }), item('01', { name: 'B' })]);
    expect(list).toHaveLength(1);
    expect(list[0]?.name).toBe('A');
    expect(warnings[0]).toContain('trùng id');
  });
  it('thiếu file ảnh thì dùng ảnh thay thế', () => {
    const { list, warnings } = run([item('01')], () => false);
    expect(list[0]?.image).toBe(FALLBACK_IMAGE);
    expect(warnings[0]).toContain('id=01');
  });
  it('không kiểm file với ảnh http', () => {
    const { list } = run([item('01', { image: 'https://x.test/a.png' })], () => false);
    expect(list[0]?.image).toBe('https://x.test/a.png');
  });
  it('sắp theo sortOrder rồi id', () => {
    const { list } = run([
      item('03', { sortOrder: 1 }),
      item('02', { sortOrder: 2 }),
      item('01', { sortOrder: 1 }),
    ]);
    expect(list.map((c) => c.id)).toEqual(['01', '03', '02']);
  });
  it('dữ liệu không phải mảng thì trả rỗng và báo', () => {
    const { list, warnings } = run({});
    expect(list).toEqual([]);
    expect(warnings).toHaveLength(1);
  });
});

describe('normalizeBoxes', () => {
  const box = (size: number, cols: number, rows: number) => ({
    size,
    cols,
    rows,
    price: 100000,
    name: `Hộp ${size}`,
  });
  it('sắp theo size, bỏ lỗi và trùng', () => {
    const warnings: string[] = [];
    const list = normalizeBoxes([box(12, 4, 3), box(6, 3, 2), box(9, 3, 4), box(6, 3, 2)], (m) =>
      warnings.push(m),
    );
    expect(list.map((b) => b.size)).toEqual([6, 12]);
    expect(warnings).toHaveLength(2);
  });
});
