export const MQ_REDUCED = '(prefers-reduced-motion: reduce)';

/** Khách có bật giảm chuyển động không (chỉ gọi ở client). */
export function motionReduced(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia(MQ_REDUCED).matches;
}

/** Đăng ký thay đổi giảm chuyển động, dùng với `useSyncExternalStore`. */
export function subscribeMotion(onChange: () => void): () => void {
  if (typeof window.matchMedia !== 'function') return () => {};
  const mq = window.matchMedia(MQ_REDUCED);
  mq.addEventListener?.('change', onChange);
  return () => mq.removeEventListener?.('change', onChange);
}
