/**
 * Giá trị chuyển động cho GSAP/JS.
 * NGUỒN GỐC là `tokens.css` (--ease-*, --duration-*): sửa ở đó trước, rồi cập nhật file này.
 * Test `motion.test.ts` kiểm tra hai nơi khớp nhau.
 */

export const ease = {
  /** --ease-out-expo */
  outExpo: 'cubic-bezier(0.16, 1, 0.3, 1)',
  /** --ease-in-out-soft */
  inOutSoft: 'cubic-bezier(0.65, 0, 0.35, 1)',
} as const;

/** Điểm điều khiển Bézier, dùng với CustomEase của GSAP khi cần. */
export const easeBezier = {
  outExpo: [0.16, 1, 0.3, 1],
  inOutSoft: [0.65, 0, 0.35, 1],
} as const;

/** Thời lượng, đơn vị mili-giây (khớp --duration-*). */
export const durationMs = {
  fast: 160,
  base: 320,
  slow: 700,
  slower: 1400,
} as const;

/** Thời lượng, đơn vị giây (GSAP dùng giây). */
export const duration = {
  fast: durationMs.fast / 1000,
  base: durationMs.base / 1000,
  slow: durationMs.slow / 1000,
  slower: durationMs.slower / 1000,
} as const;
