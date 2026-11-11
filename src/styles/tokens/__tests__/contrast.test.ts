import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { contrastRatio, parseColorTokens } from '../contrast';

const css = readFileSync(path.join(__dirname, '..', 'tokens.css'), 'utf8');
const c = parseColorTokens(css);

function color(name: string): string {
  const v = c[name];
  if (!v) throw new Error(`Thiếu token màu: ${name}`);
  return v;
}

describe('tương phản WCAG AA (>= 4.5:1)', () => {
  const grounds = ['cacao-900', 'cacao-800'];
  const onDark = ['ivory-50', 'ivory-200', 'ivory-400', 'foil-400', 'foil-500'];

  for (const g of grounds) {
    for (const fg of onDark) {
      it(`${fg} trên ${g}`, () => {
        expect(contrastRatio(color(fg), color(g))).toBeGreaterThanOrEqual(4.5);
      });
    }
  }

  it('error-400 trên cacao-900', () => {
    expect(contrastRatio(color('error-400'), color('cacao-900'))).toBeGreaterThanOrEqual(4.5);
  });

  it('cacao-900 trên ivory-100', () => {
    expect(contrastRatio(color('cacao-900'), color('ivory-100'))).toBeGreaterThanOrEqual(4.5);
  });

  it('cacao-600 (chữ phụ) trên ivory-100', () => {
    expect(contrastRatio(color('cacao-600'), color('ivory-100'))).toBeGreaterThanOrEqual(4.5);
  });

  it('foil-700 trên ivory-100', () => {
    expect(contrastRatio(color('foil-700'), color('ivory-100'))).toBeGreaterThanOrEqual(4.5);
  });

  it('cacao-900 trên foil-500 (vùng chọn, nền hover)', () => {
    expect(contrastRatio(color('cacao-900'), color('foil-500'))).toBeGreaterThanOrEqual(4.5);
  });
});
