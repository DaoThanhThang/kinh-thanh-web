'use client';

import { useEffect } from 'react';
import type { RefObject } from 'react';

/**
 * Báo cho nút nổi "Tư vấn quà" (features/chat) biết chỗ nào đang bị chiếm ở đáy màn hình:
 * - `--chat-dock-h` (trên <html>): chiều cao thanh tóm tắt dính đáy khi nó đang hiện, dưới 64rem.
 *   Khi chân trang đã lộ ra thì thanh đã rời đáy màn hình (hết phần #builder) nên bằng 0: nút nổi
 *   về góc và chân trang chừa sẵn chỗ cho nó (R2, D65).
 * - `data-bb-holding`: đang cầm một viên (thanh gợi ý + nút "Xem hộp") → nút nổi ẩn đi.
 */
export function useChatDock(ref: RefObject<HTMLElement | null>, active: boolean, holding: boolean) {
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.bbHolding = holding ? 'true' : 'false';
    return () => {
      delete root.dataset.bbHolding;
    };
  }, [holding]);

  useEffect(() => {
    const el = ref.current;
    if (
      !active ||
      !el ||
      typeof IntersectionObserver === 'undefined' ||
      typeof window.matchMedia !== 'function'
    )
      return;
    const root = document.documentElement;
    const wide = window.matchMedia('(min-width: 64rem)');
    let visible = false;
    let footerVisible = false;
    const update = () =>
      root.style.setProperty(
        '--chat-dock-h',
        visible && !footerVisible && !wide.matches ? `${el.offsetHeight}px` : '0px',
      );
    const io = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? false;
      update();
    });
    io.observe(el);
    const footer = document.querySelector('.site-footer');
    const footerIo = footer
      ? new IntersectionObserver(([entry]) => {
          footerVisible = entry?.isIntersecting ?? false;
          update();
        })
      : null;
    if (footer) footerIo?.observe(footer);
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(update) : null;
    ro?.observe(el);
    wide.addEventListener('change', update);
    return () => {
      io.disconnect();
      footerIo?.disconnect();
      ro?.disconnect();
      wide.removeEventListener('change', update);
      root.style.removeProperty('--chat-dock-h');
    };
  }, [ref, active]);
}
