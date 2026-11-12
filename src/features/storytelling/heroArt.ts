/**
 * Hình học của nền hero dạng "art" (R2, D66). MỘT nguồn cho cả ảnh tĩnh (`hero-citadel.jpg`, dựng
 * bằng `scripts/make-hero-citadel.tsx`) và các lớp động (vòng, chim) để chúng luôn khớp nhau.
 * Toạ độ thiết kế: khung 1920×1080 (cùng khung với ảnh).
 */
export const ART_W = 1920;
export const ART_H = 1080;

/** Tâm của vòng trống đồng và quỹ đạo chim: nằm trên trục dọc của cổng thành. */
export const ART_CENTER = { x: 1400, y: 490 } as const;

/** Cổng thành (CitadelPanorama, viewBox 400×226) đặt rộng 1000, trục giữa x=1400, chân tường y=820. */
export const CITADEL = { x: 900, y: 320, scale: 2.5 } as const;

/** Đồi sau cổng thành (khép kín xuống đáy khung). Vòng và chim bị che bởi vùng này. */
export const HILL_BACK =
  'M0 1080V862C170 812 360 800 540 836S850 800 990 806S1240 846 1440 776S1720 706 1920 768V1080Z';

/** Hình khối cổng thành (toạ độ viewBox 400×226) dùng làm khuôn che: mái, thân từng tầng, tường. */
export const CITADEL_SILHOUETTE = [
  'M138 62Q156 60 164 48H236Q244 60 262 62Z',
  'M150 62V76H250V62Z',
  'M104 92Q124 90 132 76H268Q276 90 296 92Z',
  'M120 92V108H280V92Z',
  'M52 124Q76 122 84 108H316Q324 122 348 124Z',
  'M72 124V150H328V124Z',
  'M36 146H364V200H36Z',
].join('');

/** Khuôn che dạng alpha: trong suốt trên cổng thành và đồi, đặc ở bầu trời. */
export function heroMaskSvg(): string {
  const { x, y, scale } = CITADEL;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ART_W} ${ART_H}">` +
    `<defs><mask id="m" maskUnits="userSpaceOnUse" x="0" y="0" width="${ART_W}" height="${ART_H}">` +
    `<rect width="${ART_W}" height="${ART_H}" fill="white"/>` +
    `<g fill="black"><path d="${HILL_BACK}"/>` +
    `<path transform="translate(${x} ${y}) scale(${scale})" d="${CITADEL_SILHOUETTE}"/></g>` +
    `</mask></defs><rect width="${ART_W}" height="${ART_H}" fill="black" mask="url(#m)"/></svg>`
  );
}

export const HERO_MASK_URL = `url("data:image/svg+xml,${encodeURIComponent(heroMaskSvg())}")`;

/** Phần trăm của khung 1920×1080 (để lớp con đặt theo % của sân khấu, co giãn cùng ảnh nền). */
export const pctX = (px: number) => `${((px / ART_W) * 100).toFixed(4)}%`;
export const pctY = (px: number) => `${((px / ART_H) * 100).toFixed(4)}%`;

/** Vòng trống đồng: hình vuông 2R quanh tâm. */
export const RING_R = 450;

type Bird = {
  /** Góc xuất phát, độ, tính theo chiều kim đồng hồ từ đỉnh. */
  angle: number;
  /** Bán kính quỹ đạo (px thiết kế). */
  r: number;
  /** Chiều rộng con chim (px thiết kế). */
  w: number;
  opacity: number;
};

type Orbit = {
  id: string;
  /** Nửa cạnh của hình vuông chứa quỹ đạo (px thiết kế); lớn hơn r lớn nhất + nửa chim. */
  half: number;
  /** Một vòng quay hết bao nhiêu giây. */
  seconds: number;
  birds: readonly Bird[];
};

/** Hai quỹ đạo (hai lớp động) quay cùng chiều, tốc độ hơi khác nhau để có thị sai. */
export const ORBITS: readonly Orbit[] = [
  {
    id: 'inner',
    half: 420,
    seconds: 64,
    birds: [
      { angle: -38, r: 292, w: 150, opacity: 0.9 },
      { angle: 78, r: 338, w: 104, opacity: 0.75 },
      { angle: 205, r: 262, w: 92, opacity: 0.7 },
    ],
  },
  {
    id: 'outer',
    half: 480,
    seconds: 86,
    birds: [
      { angle: 18, r: 408, w: 118, opacity: 0.8 },
      { angle: -126, r: 412, w: 82, opacity: 0.6 },
    ],
  },
];

export const RING_SECONDS = 120;
