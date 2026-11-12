'use client';

import { useEffect, useSyncExternalStore } from 'react';
import type { RefObject } from 'react';
import { scrollEdges } from '../lib/scrollEdges';

/** Từ 64rem khay là khung cao bằng cột hộp và danh sách cuộn bên trong (D68). */
export const TRAY_SCROLL_QUERY = '(min-width: 64rem)';

function subscribe(onChange: () => void) {
  if (typeof window.matchMedia !== 'function') return () => undefined;
  const mq = window.matchMedia(TRAY_SCROLL_QUERY);
  mq.addEventListener?.('change', onChange);
  return () => mq.removeEventListener?.('change', onChange);
}

const getSnapshot = () =>
  typeof window.matchMedia === 'function' && window.matchMedia(TRAY_SCROLL_QUERY).matches;

/** Máy chủ và lần render đầu: false (luồng mobile), cập nhật sau khi hydrate. */
export function useTrayScrollMode(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

/**
 * Cập nhật `data-more-above` / `data-more-below` / `data-overflow` trên `host` theo vị trí cuộn của
 * `scroller`, trực tiếp trên DOM (không render lại). Nghe scroll với passive + rAF, và đo lại khi
 * khung hoặc nội dung đổi kích thước.
 */
export function useScrollEdgeAttrs(
  scrollerRef: RefObject<HTMLElement | null>,
  hostRef: RefObject<HTMLElement | null>,
  enabled: boolean,
) {
  useEffect(() => {
    const scroller = scrollerRef.current;
    const host = hostRef.current;
    if (!enabled || !scroller || !host) return;
    let frame = 0;
    const apply = () => {
      frame = 0;
      const e = scrollEdges(scroller.scrollTop, scroller.clientHeight, scroller.scrollHeight);
      host.dataset.overflow = String(e.overflow);
      host.dataset.moreAbove = String(e.moreAbove);
      host.dataset.moreBelow = String(e.moreBelow);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(apply);
    };
    apply();
    scroller.addEventListener('scroll', schedule, { passive: true });
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(schedule) : null;
    ro?.observe(scroller);
    if (scroller.firstElementChild) ro?.observe(scroller.firstElementChild);
    return () => {
      scroller.removeEventListener('scroll', schedule);
      ro?.disconnect();
      if (frame) cancelAnimationFrame(frame);
      delete host.dataset.overflow;
      delete host.dataset.moreAbove;
      delete host.dataset.moreBelow;
    };
  }, [scrollerRef, hostRef, enabled]);
}
