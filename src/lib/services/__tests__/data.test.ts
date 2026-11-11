import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import boxesRaw from '../../../../data/boxes.json';
import chocolatesRaw from '../../../../data/chocolates.json';
import { normalizeBoxes, normalizeChocolates } from '../catalog-core';

const pub = path.join(process.cwd(), 'public');

describe('dữ liệu thật', () => {
  it('có 12 viên hợp lệ, ảnh đều tồn tại, không cảnh báo', () => {
    const warnings: string[] = [];
    const list = normalizeChocolates(chocolatesRaw, {
      exists: (p) => existsSync(path.join(pub, p)),
      warn: (m) => warnings.push(m),
    });
    expect(warnings).toEqual([]);
    expect(list).toHaveLength(12);
    for (const c of list) expect(existsSync(path.join(pub, c.image))).toBe(true);
  });
  it('có 4 hộp hợp lệ (6, 9, 12, 16)', () => {
    const warnings: string[] = [];
    const list = normalizeBoxes(boxesRaw, (m) => warnings.push(m));
    expect(warnings).toEqual([]);
    expect(list.map((b) => b.size)).toEqual([6, 9, 12, 16]);
  });
});

describe('SVG ảnh tạm', () => {
  const dir = path.join(pub, 'chocolates');
  const files = readdirSync(dir).filter((f) => f.endsWith('.svg'));
  it('có đủ 12 viên + fallback', () => {
    expect(files).toHaveLength(13);
    expect(files).toContain('fallback.svg');
  });
  it.each(files)('%s hợp lệ, nhẹ, không script', (file) => {
    const full = path.join(dir, file);
    const text = readFileSync(full, 'utf8');
    expect(text.trimStart().startsWith('<svg')).toBe(true);
    expect(text).toContain('viewBox');
    expect(statSync(full).size).toBeLessThan(6 * 1024);
    expect(text).not.toMatch(/<script/i);
    const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
    expect(doc.querySelector('parsererror')).toBeNull();
  });
});
