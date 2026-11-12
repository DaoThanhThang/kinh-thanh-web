/**
 * Màu cho email và ảnh khay. Email và SVG rasterize không dùng được CSS variable, nên các giá trị
 * này sao theo `src/styles/tokens/tokens.css` (cacao, foil, ivory). Đổi token thì đổi ở đây (D56).
 */
export const MAIL_COLORS = {
  cacao950: '#1a100b',
  cacao900: '#24160f',
  cacao800: '#2f1e15',
  cacao700: '#3e2a1e',
  cacao600: '#5a3e2c',
  foil300: '#e6cc92',
  foil400: '#d4b06a',
  foil500: '#c9a45c',
  foil600: '#a8843f',
  foil700: '#7a5e2a',
  ivory50: '#f6efe2',
  ivory100: '#f3ebdc',
  ivory200: '#e3d6bf',
  ivory400: '#bfae93',
} as const;

export const BRAND_NAME = 'Kinh Thành Chocolate';
