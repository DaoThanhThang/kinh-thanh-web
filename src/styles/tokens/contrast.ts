/** Tiện ích đọc token màu từ tokens.css và tính tương phản WCAG. */

const HEX_TOKEN = /--color-([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\s*;/g;

/** Trả về map tên màu nguyên thủy (vd `cacao-900`) → hex. */
export function parseColorTokens(css: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of css.matchAll(HEX_TOKEN)) {
    const [, name, hex] = m;
    if (name && hex) out[name] = hex.toLowerCase();
  }
  return out;
}

/** Độ sáng tương đối theo WCAG 2.x. */
export function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Tỉ lệ tương phản giữa hai màu hex (1–21). */
export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
