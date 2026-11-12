import { describe, expect, it } from 'vitest';
import { resolveSuggestion } from '../suggestion';
import { BOXES, CHOCOLATES } from './fixtures';

const ok = {
  size: 6,
  pieces: ['01', '02', '03', '04', '05', '06'],
  title: 'Hộp thử',
  reason: 'Vì hợp.',
};

describe('resolveSuggestion', () => {
  it('hộp hợp lệ: tính tổng giá ở server từ catalog', () => {
    const s = resolveSuggestion(ok, CHOCOLATES, BOXES);
    expect(s).not.toBeNull();
    // 35k+40k+45k+50k+55k+60k = 285k + hộp 120k
    expect(s?.total).toBe(285000 + 120000);
    expect(s?.boxPrice).toBe(120000);
    expect(s?.cols).toBe(3);
    expect(s?.rows).toBe(2);
    expect(s?.items).toHaveLength(6);
  });

  it('size không có thật → bỏ', () => {
    expect(resolveSuggestion({ ...ok, size: 7 }, CHOCOLATES, BOXES)).toBeNull();
    expect(resolveSuggestion({ ...ok, size: 16 }, CHOCOLATES, BOXES)).toBeNull(); // không có trong BOXES fixture
  });

  it('id lạ hoặc hết hàng bị loại, thiếu viên thì lặp vòng cho đủ size', () => {
    const s = resolveSuggestion(
      { ...ok, pieces: ['01', '02', '03', '04', 'zz', '12'] },
      CHOCOLATES,
      BOXES,
    );
    expect(s?.pieces).toEqual(['01', '02', '03', '04', '01', '02']);
  });

  it('thừa viên → cắt đúng size', () => {
    const s = resolveSuggestion(
      { ...ok, pieces: ['01', '02', '03', '04', '05', '06', '07', '08'] },
      CHOCOLATES,
      BOXES,
    );
    expect(s?.pieces).toHaveLength(6);
  });

  it('phần lớn id sai hoặc không còn id hợp lệ → bỏ', () => {
    expect(
      resolveSuggestion({ ...ok, pieces: ['x', 'y', 'z', '01'] }, CHOCOLATES, BOXES),
    ).toBeNull();
    expect(resolveSuggestion({ ...ok, pieces: ['x', 'y'] }, CHOCOLATES, BOXES)).toBeNull();
    expect(resolveSuggestion({ ...ok, pieces: [] }, CHOCOLATES, BOXES)).toBeNull();
  });

  it('đầu vào rác → null, không ném lỗi', () => {
    for (const bad of [null, undefined, 'x', 5, [], { size: 6 }, { size: 6, pieces: 'abc' }]) {
      expect(resolveSuggestion(bad, CHOCOLATES, BOXES)).toBeNull();
    }
  });

  it('cắt title ≤ 60 và reason ≤ 200; thiếu title dùng tên hộp', () => {
    const s = resolveSuggestion(
      { ...ok, title: 'a'.repeat(100), reason: 'b'.repeat(500) },
      CHOCOLATES,
      BOXES,
    );
    expect(Array.from(s?.title ?? '').length).toBeLessThanOrEqual(60);
    expect(Array.from(s?.reason ?? '').length).toBeLessThanOrEqual(200);
    expect(resolveSuggestion({ ...ok, title: '  ' }, CHOCOLATES, BOXES)?.title).toBe('Hộp 6 viên');
  });
});
