import { describe, expect, it } from 'vitest';
import { scrollEdges } from '../lib/scrollEdges';

describe('scrollEdges', () => {
  it('không tràn: không có mép nào', () => {
    expect(scrollEdges(0, 500, 500)).toEqual({
      overflow: false,
      moreAbove: false,
      moreBelow: false,
    });
    expect(scrollEdges(0, 500, 501)).toEqual({
      overflow: false,
      moreAbove: false,
      moreBelow: false,
    });
  });
  it('tràn, đang ở đầu: chỉ còn phía dưới', () => {
    expect(scrollEdges(0, 400, 1000)).toEqual({
      overflow: true,
      moreAbove: false,
      moreBelow: true,
    });
  });
  it('giữa danh sách: cả hai phía', () => {
    expect(scrollEdges(300, 400, 1000)).toEqual({
      overflow: true,
      moreAbove: true,
      moreBelow: true,
    });
  });
  it('tới đáy (sai số làm tròn): chỉ còn phía trên', () => {
    expect(scrollEdges(599.4, 400, 1000)).toEqual({
      overflow: true,
      moreAbove: true,
      moreBelow: false,
    });
    expect(scrollEdges(600, 400, 1000).moreBelow).toBe(false);
  });
});
