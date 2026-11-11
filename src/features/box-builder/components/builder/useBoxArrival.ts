'use client';

import { useCallback, useEffect, useState, type RefObject } from 'react';
import { prefersReducedMotion } from '@/lib/utils/motion';

/** Thời lượng nắp mở lần đầu (khớp `.bb-stage[data-arrival='opening']` trong builder.css). */
export const ARRIVAL_MS = 1400;
/** Ngưỡng thấy được của khung hộp để bắt đầu mở nắp. */
export const ARRIVAL_THRESHOLD = 0.35;

export type ArrivalState = 'pending' | 'opening' | 'open';

/**
 * Hộp builder ĐÓNG khi vừa tới; mở nắp một lần khi ≥35% khung hộp vào màn hình (D42).
 *
 * - `pending`: nắp đóng, khay bị khoá. `opening`: nắp đang lật (CSS transition `--open`), vẫn khoá.
 *   `open`: dùng bình thường.
 * - Hộp đã có viên (người dùng quay lại), giảm chuyển động hoặc không có IntersectionObserver →
 *   mở ngay, không hoạt ảnh (`instant`). Có viên được thêm khi nắp còn đóng → mở (có hoạt ảnh).
 * - Builder gọi `init(hasPieces)` đúng một lần sau khi hydrate store (trước đó chưa biết).
 */
export function useBoxArrival(areaRef: RefObject<HTMLElement | null>, hasPieces: boolean) {
  const noObserver = typeof IntersectionObserver === 'undefined';
  const [seen, setSeen] = useState(false);
  const [mode, setMode] = useState<'wait' | 'instant' | 'animate'>('wait');
  const [settled, setSettled] = useState(false);

  const init = useCallback(
    (pieces: boolean) =>
      setMode(
        pieces || prefersReducedMotion() || typeof IntersectionObserver === 'undefined'
          ? 'instant'
          : 'animate',
      ),
    [],
  );

  // Một IntersectionObserver, chỉ lần đầu: thấy ≥35% thì ngắt.
  useEffect(() => {
    const el = areaRef.current;
    if (!el || noObserver) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: ARRIVAL_THRESHOLD },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [areaRef, noObserver]);

  const requested = mode === 'instant' || (mode === 'animate' && (seen || hasPieces));

  // Sau khi mở: chờ hết hoạt ảnh (hoặc một nhịp ngắn nếu tức thì) rồi bỏ cờ chuyển tiếp.
  useEffect(() => {
    if (!requested || settled) return;
    const id = window.setTimeout(
      () => setSettled(true),
      mode === 'instant' ? 120 : ARRIVAL_MS + 50,
    );
    return () => window.clearTimeout(id);
  }, [requested, settled, mode]);

  const state: ArrivalState = !requested
    ? 'pending'
    : mode === 'instant' || settled
      ? 'open'
      : 'opening';

  return { state, instant: mode === 'instant' && !settled, init };
}
