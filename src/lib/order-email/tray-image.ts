import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { MAIL_COLORS as C } from './theme';

/** Ảnh khay: khung cacao, khay vàng, ngăn chia vàng, mỗi ô là ảnh viên đã chọn + số ô (1..N). */

export const TRAY_WIDTH = 1200;
const FRAME = 56;
const GAP = 16;
const CAPTION_H = 96;

export const FALLBACK_PIECE = '/chocolates/fallback.svg';

const FONT_FILE = path.join(
  process.cwd(),
  'src',
  'lib',
  'order-email',
  'fonts',
  'BeVietnamPro_600SemiBold.ttf',
);
const FONT_FAMILY = 'Be Vietnam Pro';

const MIME: Record<string, string> = {
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
};

const dataUriCache = new Map<string, string | null>();

/** resvg-js không giải mã được WebP: đổi sang PNG bằng sharp (đã có sẵn theo Next.js). */
async function webpToPng(bytes: Buffer): Promise<Buffer | null> {
  try {
    const { default: sharp } = await import('sharp');
    return await sharp(bytes).png().toBuffer();
  } catch (err) {
    console.warn('[tray-image] không đổi được WebP sang PNG, dùng ảnh thay thế.', err);
    return null;
  }
}

async function readPublicFile(publicPath: string, root: string): Promise<string | null> {
  const ext = path.extname(publicPath).toLowerCase();
  let mime = MIME[ext];
  if (!mime || !publicPath.startsWith('/')) return null;
  const publicDir = path.join(root, 'public');
  const file = path.join(publicDir, publicPath);
  // Chặn đường dẫn thoát khỏi /public.
  if (!file.startsWith(publicDir + path.sep)) return null;
  try {
    let bytes: Buffer | null = await readFile(file);
    if (ext === '.webp') {
      bytes = await webpToPng(bytes);
      mime = 'image/png';
    }
    return bytes ? `data:${mime};base64,${bytes.toString('base64')}` : null;
  } catch {
    return null;
  }
}

/**
 * Đọc ảnh viên trong /public thành data URI (mime theo đuôi file: svg, png, webp, jpg).
 * File thiếu, đuôi lạ hoặc ảnh ngoài (http) → fallback.svg; thiếu cả fallback → null.
 */
export async function loadPieceDataUri(
  publicPath: string,
  root: string = process.cwd(),
): Promise<string | null> {
  const key = `${root}\0${publicPath}`;
  const cached = dataUriCache.get(key);
  if (cached !== undefined) return cached;
  const uri =
    (await readPublicFile(publicPath, root)) ?? (await readPublicFile(FALLBACK_PIECE, root));
  dataUriCache.set(key, uri);
  return uri;
}

export type TrayInput = {
  cols: number;
  rows: number;
  /** Đường dẫn ảnh (bắt đầu bằng "/", trong /public) của từng ô theo thứ tự trái → phải, trên → dưới. */
  images: readonly string[];
  /** Dòng chữ nhỏ dưới khay (mã đơn, cỡ hộp). */
  caption?: string;
};

const escXml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function trayDimensions(cols: number, rows: number) {
  const cell = Math.floor((TRAY_WIDTH - 2 * FRAME - (cols + 1) * GAP) / cols);
  const trayW = cols * cell + (cols + 1) * GAP;
  const trayH = rows * cell + (rows + 1) * GAP;
  return { cell, trayW, trayH, width: TRAY_WIDTH, height: FRAME + trayH + CAPTION_H };
}

/** SVG của khay, đúng như khách đã xếp. Ô thiếu ảnh trong `images` vẫn vẽ ngăn trống. */
export async function buildTraySvg(input: TrayInput): Promise<string> {
  const { cols, rows, images, caption } = input;
  const { cell, trayW, trayH, width, height } = trayDimensions(cols, rows);
  const trayX = Math.round((width - trayW) / 2);
  const trayY = FRAME;
  const badgeR = Math.max(18, Math.round(cell * 0.085));
  const pad = Math.round(cell * 0.07);

  const uris = await Promise.all(
    Array.from({ length: cols * rows }, (_, i) => {
      const src = images[i];
      return src ? loadPieceDataUri(src) : Promise.resolve(null);
    }),
  );

  const cells: string[] = [];
  for (let i = 0; i < cols * rows; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = trayX + GAP + col * (cell + GAP);
    const y = trayY + GAP + row * (cell + GAP);
    const uri = uris[i];
    const piece = uri
      ? `<image x="${x + pad}" y="${y + pad}" width="${cell - 2 * pad}" height="${cell - 2 * pad}" preserveAspectRatio="xMidYMid meet" href="${uri}"/>`
      : '';
    const bx = x + badgeR + 12;
    const by = y + badgeR + 12;
    const fs = Math.round(badgeR * 1.1);
    cells.push(
      `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="14" fill="url(#well)" stroke="${C.cacao950}" stroke-width="3"/>` +
        piece +
        `<circle cx="${bx}" cy="${by}" r="${badgeR}" fill="${C.foil400}" stroke="${C.cacao950}" stroke-width="3"/>` +
        `<text x="${bx}" y="${by + Math.round(fs * 0.36)}" text-anchor="middle" font-family="${FONT_FAMILY}" font-weight="600" font-size="${fs}" fill="${C.cacao950}">${i + 1}</text>`,
    );
  }

  const captionText = caption
    ? `<text x="${width / 2}" y="${trayY + trayH + 58}" text-anchor="middle" font-family="${FONT_FAMILY}" font-weight="600" font-size="30" letter-spacing="3" fill="${C.foil300}">${escXml(caption)}</text>`
    : '';

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    `<defs>` +
    `<linearGradient id="frame" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.cacao800}"/><stop offset="1" stop-color="${C.cacao950}"/></linearGradient>` +
    `<linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.foil300}"/><stop offset="0.45" stop-color="${C.foil500}"/><stop offset="1" stop-color="${C.foil600}"/></linearGradient>` +
    `<linearGradient id="well" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.cacao900}"/><stop offset="1" stop-color="${C.cacao700}"/></linearGradient>` +
    `</defs>` +
    `<rect width="${width}" height="${height}" fill="url(#frame)"/>` +
    `<rect x="14" y="14" width="${width - 28}" height="${height - 28}" rx="22" fill="none" stroke="${C.foil600}" stroke-width="2" opacity="0.7"/>` +
    `<rect x="${trayX}" y="${trayY}" width="${trayW}" height="${trayH}" rx="20" fill="url(#gold)" stroke="${C.foil700}" stroke-width="4"/>` +
    cells.join('') +
    captionText +
    `</svg>`
  );
}

/** Rasterize khay thành PNG rộng 1200px. Mất khoảng 150-350ms. */
export async function renderTrayPng(input: TrayInput): Promise<Buffer> {
  const resvg = new Resvg(await buildTraySvg(input), {
    fitTo: { mode: 'width', value: TRAY_WIDTH },
    font: {
      loadSystemFonts: false,
      fontFiles: [FONT_FILE],
      defaultFontFamily: FONT_FAMILY,
    },
  });
  return resvg.render().asPng();
}
