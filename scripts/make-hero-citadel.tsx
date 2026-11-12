/**
 * Dựng `public/media/hero-citadel.jpg` (1920×1080): lớp TĨNH của nền hero dạng art (R2, D66).
 * Gồm hoàng hôn cacao, ánh sáng sau cổng thành, sao nhỏ, đồi, cổng thành, sóng. KHÔNG có vòng trống
 * đồng và KHÔNG có chim (hai lớp đó quay bằng mã trong `HeroArt`). Cổng thành vẽ bằng chính
 * `CitadelPanorama`; hình học (vị trí, đồi, khuôn) lấy từ `src/features/storytelling/heroArt.ts`.
 *
 * Chạy: npx tsx scripts/make-hero-citadel.tsx   (cần `playwright` và `sharp`)
 */
import { readFileSync, statSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import sharp from 'sharp';
import { renderToStaticMarkup } from 'react-dom/server';
import { CitadelPanorama } from '../src/features/box-builder/components/box/art/CitadelPanorama';
import { wave } from '../src/features/box-builder/components/box/art/paths';
import {
  ART_H,
  ART_W,
  CITADEL,
  CITADEL_SILHOUETTE,
  HILL_BACK,
} from '../src/features/storytelling/heroArt';

const require = createRequire(import.meta.url);
// Playwright không phải dependency của dự án (có sẵn ở máy dựng): khai báo phần dùng tới.
const { chromium } = require('playwright') as {
  chromium: {
    launch(): Promise<{
      newPage(o: {
        viewport: { width: number; height: number };
        deviceScaleFactor: number;
      }): Promise<{
        setContent(html: string): Promise<void>;
        locator(sel: string): { screenshot(o: { type: 'png' }): Promise<Buffer> };
      }>;
      close(): Promise<void>;
    }>;
  };
};

const root = fileURLToPath(new URL('..', import.meta.url));
const tokens = readFileSync(`${root}src/styles/tokens/tokens.css`, 'utf8');
const color = (name: string): string => {
  const m = tokens.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!m?.[1]) throw new Error(`Thiếu token màu ${name}`);
  return m[1];
};
const palette = {
  c950: color('cacao-950'),
  c900: color('cacao-900'),
  c700: color('cacao-700'),
  c600: color('cacao-600'),
  foil500: color('foil-500'),
  foil300: color('foil-300'),
  foil700: color('foil-700'),
};

/** Số ngẫu nhiên tất định (mulberry32) để ảnh dựng lại luôn giống nhau. */
function rng(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = rng(20261112);
const stars = Array.from({ length: 46 }, () => {
  const x = rand() * ART_W;
  const y = rand() * 640;
  const r = 0.7 + rand() * 1.1;
  const o = 0.18 + rand() * 0.4;
  return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" opacity="${o.toFixed(2)}"/>`;
}).join('');

/** Sóng biển: các dải ngang mảnh, thưa dần về phía xa. */
const sea = Array.from({ length: 11 }, (_, i) => {
  const y = 884 + i * 17;
  const amp = 4 + i * 0.5;
  const o = 0.12 + (i / 10) * 0.2;
  return `<path d="${wave(-40, ART_W + 60, y, amp, 56 + i * 4)}" opacity="${o.toFixed(2)}"/>`;
}).join('');

const swells = [
  `<path d="M0 861C240 846 520 872 800 860S1240 836 1500 852S1760 838 1920 846" opacity="0.5"/>`,
  `<path d="M880 842C1100 830 1300 852 1500 840S1780 830 1920 836" opacity="0.4"/>`,
  `<path d="M0 872C300 860 620 884 900 872" opacity="0.3"/>`,
].join('');

const citadel = renderToStaticMarkup(<CitadelPanorama />);
const { x: cx, y: cy, scale } = CITADEL;

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
:root{--c950:${palette.c950};--c900:${palette.c900};--c700:${palette.c700};--c600:${palette.c600};
--foil:${palette.foil500};--foil-bright:${palette.foil300};--foil-deep:${palette.foil700};}
html,body{margin:0;background:#000}
#art{position:relative;width:${ART_W}px;height:${ART_H}px;overflow:hidden;
background:
 radial-gradient(ellipse 900px 620px at 1400px 760px, color-mix(in srgb,var(--c600) 100%,transparent), transparent 74%),
 radial-gradient(ellipse 980px 300px at 1480px 842px, color-mix(in srgb,var(--foil-deep) 46%,transparent), transparent 70%),
 radial-gradient(circle 470px at 1400px 500px, color-mix(in srgb,var(--foil) 24%,transparent), transparent 80%),
 linear-gradient(to right, color-mix(in srgb,black 30%,transparent), transparent 48%),
 linear-gradient(to bottom, color-mix(in srgb,var(--c950) 62%,black) 0%, var(--c950) 52%, var(--c900) 78%, var(--c950) 100%);}
svg.layer{position:absolute;left:0;top:0;width:${ART_W}px;height:${ART_H}px}
svg.citadel{position:absolute;left:${cx}px;top:${cy}px;width:${400 * scale}px;height:${226 * scale}px;color:var(--foil);--foil-w:2.3px}
.sky circle{fill:var(--foil-bright)}
.hill{fill:color-mix(in srgb,var(--c950) 92%,black);stroke:var(--foil);stroke-width:1.3;stroke-opacity:.36}
.sea{fill:none;stroke:var(--foil);stroke-width:1.3}
.swell{fill:none;stroke:var(--foil);stroke-width:1.5}
.body{fill:color-mix(in srgb,var(--c900) 86%,black)}
.floor{fill:color-mix(in srgb,var(--c950) 88%,black)}
</style></head><body><div id="art">
<svg class="layer sky" viewBox="0 0 ${ART_W} ${ART_H}">${stars}</svg>
<svg class="layer" viewBox="0 0 ${ART_W} ${ART_H}"><path class="hill" d="${HILL_BACK}"/></svg>
<svg class="citadel" viewBox="0 0 400 226"><path class="body" d="${CITADEL_SILHOUETTE}"/></svg>
${citadel.replace('<svg ', '<svg class="citadel" ')}
<svg class="layer" viewBox="0 0 ${ART_W} ${ART_H}">
<rect class="floor" x="0" y="868" width="${ART_W}" height="${ART_H - 868}" opacity="0.9"/>
<g class="swell">${swells}</g><g class="sea">${sea}</g></svg>
</div></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: ART_W, height: ART_H },
  deviceScaleFactor: 2,
});
await page.setContent(html);
const png = await page.locator('#art').screenshot({ type: 'png' });
await browser.close();

const out = `${root}public/media/hero-citadel.jpg`;
for (const quality of [84, 78, 72, 66]) {
  const jpg = await sharp(png)
    .resize(ART_W, ART_H, { kernel: 'lanczos3' })
    .jpeg({ quality, mozjpeg: true, chromaSubsampling: '4:4:4' })
    .toBuffer();
  writeFileSync(out, jpg);
  const kb = statSync(out).size / 1024;
  console.log(`quality ${quality}: ${kb.toFixed(0)} KB`);
  if (kb <= 240) break;
}
