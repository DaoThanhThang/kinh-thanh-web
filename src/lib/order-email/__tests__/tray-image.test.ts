// @vitest-environment node
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { buildTraySvg, loadPieceDataUri, renderTrayPng, trayDimensions } from '../tray-image';

const ids = (n: number) =>
  Array.from({ length: n }, (_, i) => `/chocolates/${String((i % 12) + 1).padStart(2, '0')}.svg`);

const png = (buf: Buffer) => ({
  signature: buf.subarray(0, 8).toString('hex'),
  width: buf.readUInt32BE(16),
  height: buf.readUInt32BE(20),
});

describe('renderTrayPng', () => {
  it.each([
    [6, 3, 2],
    [9, 3, 3],
    [12, 4, 3],
    [16, 4, 4],
  ])('hộp %i viên (%i×%i) → PNG hợp lệ rộng 1200px đúng chiều cao', async (_n, cols, rows) => {
    const t0 = performance.now();
    const buf = await renderTrayPng({
      cols,
      rows,
      images: ids(cols * rows),
      caption: 'KT-1 · Hộp',
    });
    const ms = performance.now() - t0;
    const info = png(buf);
    expect(info.signature).toBe('89504e470d0a1a0a');
    expect(info.width).toBe(1200);
    expect(info.height).toBe(trayDimensions(cols, rows).height);
    // Mục tiêu < 500ms (đã làm nóng ở lần chạy đầu của bộ test này; chừa dư cho máy CI chậm).
    expect(ms).toBeLessThan(2000);
  });

  it('dưới 500ms khi đã nóng (16 ô)', async () => {
    const input = { cols: 4, rows: 4, images: ids(16) };
    await renderTrayPng(input);
    const t0 = performance.now();
    await renderTrayPng(input);
    expect(performance.now() - t0).toBeLessThan(500);
  });
});

describe('buildTraySvg', () => {
  it('có số ô 1..N và nhúng ảnh viên dạng data URI', async () => {
    const svg = await buildTraySvg({ cols: 3, rows: 2, images: ids(6) });
    for (let n = 1; n <= 6; n++) expect(svg).toContain(`>${n}</text>`);
    expect(svg.match(/href="data:image\/svg\+xml;base64,/g)).toHaveLength(6);
  });

  it('ảnh thiếu / đuôi lạ / đường dẫn thoát khỏi public → fallback.svg', async () => {
    const [ok, missing, odd, escape] = await Promise.all([
      loadPieceDataUri('/chocolates/01.svg'),
      loadPieceDataUri('/chocolates/khong-co.svg'),
      loadPieceDataUri('/chocolates/01.txt'),
      loadPieceDataUri('/chocolates/../../package.json'),
    ]);
    const fallback = await loadPieceDataUri('/chocolates/fallback.svg');
    expect(ok).not.toBe(fallback);
    expect(missing).toBe(fallback);
    expect(odd).toBe(fallback);
    expect(escape).toBe(fallback);
  });
});

describe('loadPieceDataUri: định dạng ảnh thật', () => {
  it('chọn mime theo đuôi (png, jpg), WebP đổi sang PNG, thiếu cả fallback → null', async () => {
    const root = mkdtempSync(path.join(os.tmpdir(), 'tray-'));
    mkdirSync(path.join(root, 'public', 'chocolates'), { recursive: true });
    const base = sharp({
      create: { width: 8, height: 8, channels: 3, background: '#7a5e2a' },
    });
    const write = async (name: string, buf: Buffer) =>
      writeFileSync(path.join(root, 'public', 'chocolates', name), buf);
    await write('a.png', await base.clone().png().toBuffer());
    await write('b.jpg', await base.clone().jpeg().toBuffer());
    await write('c.webp', await base.clone().webp().toBuffer());

    expect(await loadPieceDataUri('/chocolates/a.png', root)).toMatch(/^data:image\/png;base64,/);
    expect(await loadPieceDataUri('/chocolates/b.jpg', root)).toMatch(/^data:image\/jpeg;base64,/);
    expect(await loadPieceDataUri('/chocolates/c.webp', root)).toMatch(/^data:image\/png;base64,/);
    expect(await loadPieceDataUri('/chocolates/zzz.png', root)).toBeNull();
  });
});
