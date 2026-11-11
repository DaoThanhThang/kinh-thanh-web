import { describe, expect, it } from 'vitest';
import { boxCssVars, boxGeometry } from '../geometry';
import { starPath } from '../art/paths';

describe('boxGeometry', () => {
  it('hộp 12 (4×3) xấp xỉ 4:3', () => {
    expect(boxGeometry(4, 3).aspect).toBeGreaterThan(1.25);
    expect(boxGeometry(4, 3).aspect).toBeLessThan(1.45);
  });

  it('tỉ lệ theo lưới: 3×2 rộng hơn 4×3, 4×4 gần vuông', () => {
    expect(boxGeometry(3, 2).aspect).toBeGreaterThan(boxGeometry(4, 3).aspect);
    expect(boxGeometry(4, 4).aspect).toBeLessThan(boxGeometry(4, 3).aspect);
  });

  it('boxCssVars chứa cols, rows và tỉ lệ', () => {
    const v = boxCssVars(4, 3);
    expect(v['--cols']).toBe(4);
    expect(v['--rows']).toBe(3);
    expect(Number(v['--ar'])).toBeCloseTo(boxGeometry(4, 3).aspect, 3);
  });
});

describe('starPath', () => {
  it('ngôi sao 14 cánh có 28 đỉnh', () => {
    expect(starPath(14, 10, 4).split('L').length).toBe(28);
  });
});
