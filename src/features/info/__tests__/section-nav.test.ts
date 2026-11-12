import { describe, expect, it } from 'vitest';
import { activeSectionId } from '../section-nav';
import { groupFaq } from '../faq-groups';

const S = (...tops: number[]) =>
  ['a', 'b', 'c', 'd'].slice(0, tops.length).map((id, i) => ({ id, top: tops[i] ?? 0 }));

describe('activeSectionId', () => {
  it('không có mục → null', () => {
    expect(activeSectionId([], 300)).toBeNull();
  });
  it('chưa mục nào qua vạch → mục đầu', () => {
    expect(activeSectionId(S(500, 1200, 2000), 300)).toBe('a');
  });
  it('lấy mục cuối cùng đã qua vạch', () => {
    expect(activeSectionId(S(-900, -100, 250, 900), 300)).toBe('c');
    expect(activeSectionId(S(-900, -100, 301, 900), 300)).toBe('b');
  });
  it('mép trên đúng bằng vạch tính là đã qua', () => {
    expect(activeSectionId(S(-10, 300, 800), 300)).toBe('b');
  });
  it('cuộn tới đáy trang → mục cuối dù chưa chạm vạch', () => {
    expect(activeSectionId(S(-900, -400, 600), 300, true)).toBe('c');
  });
});

describe('groupFaq', () => {
  it('gom theo nhóm, giữ thứ tự xuất hiện; không nhóm thì xếp cuối không tiêu đề', () => {
    const g = groupFaq([
      { question: 'q1', answer: 'a', group: 'X' },
      { question: 'q2', answer: 'a', group: '' },
      { question: 'q3', answer: 'a', group: 'Y' },
      { question: 'q4', answer: 'a', group: 'X' },
    ]);
    expect(g.map((x) => x.title)).toEqual(['X', 'Y', '']);
    expect(g[0]?.items.map((i) => i.question)).toEqual(['q1', 'q4']);
    expect(g[2]?.items.map((i) => i.question)).toEqual(['q2']);
  });
});
