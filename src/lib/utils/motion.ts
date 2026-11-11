/** Người dùng bật "giảm chuyển động". An toàn khi chạy ngoài trình duyệt / môi trường test. */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}
