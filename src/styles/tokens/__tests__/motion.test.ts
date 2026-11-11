import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { durationMs, ease } from '../motion';

const css = readFileSync(path.join(__dirname, '..', 'tokens.css'), 'utf8');

function cssVar(name: string): string {
  const m = css.match(new RegExp(`--${name}:\\s*([^;]+);`));
  if (!m?.[1]) throw new Error(`Thiếu token: ${name}`);
  return m[1].trim();
}

describe('motion.ts khớp tokens.css', () => {
  it('easing', () => {
    expect(ease.outExpo).toBe(cssVar('ease-out-expo'));
    expect(ease.inOutSoft).toBe(cssVar('ease-in-out-soft'));
  });

  it('thời lượng', () => {
    expect(`${durationMs.fast}ms`).toBe(cssVar('duration-fast'));
    expect(`${durationMs.base}ms`).toBe(cssVar('duration-base'));
    expect(`${durationMs.slow}ms`).toBe(cssVar('duration-slow'));
    expect(`${durationMs.slower}ms`).toBe(cssVar('duration-slower'));
  });
});
