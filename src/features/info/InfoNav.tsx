'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { activeSectionId } from './section-nav';

export type InfoNavItem = { id: string; label: string };

/**
 * Mục lục trong trang. ≥64rem: cột dính bên trái; dưới đó: hàng chip cuộn ngang dính dưới thanh đầu.
 * Mục đang đọc theo IntersectionObserver (vạch ở 35% chiều cao khung nhìn), đánh dấu bằng
 * `aria-current="location"` và nét foil mảnh.
 */
export function InfoNav({ items, label }: { items: readonly InfoNavItem[]; label: string }) {
  const [active, setActive] = useState<string | null>(items[0]?.id ?? null);
  const listRef = useRef<HTMLUListElement>(null);

  const measure = useCallback(() => {
    const tops = items
      .map(({ id }) => {
        const el = document.getElementById(id);
        return el ? { id, top: el.getBoundingClientRect().top } : null;
      })
      .filter((v): v is { id: string; top: number } => v !== null);
    const doc = document.documentElement;
    const atBottom =
      window.scrollY > 0 && window.innerHeight + window.scrollY >= doc.scrollHeight - 2;
    setActive(activeSectionId(tops, window.innerHeight * 0.35, atBottom));
  }, [items]);

  useEffect(() => {
    const targets = items
      .map(({ id }) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (targets.length === 0 || typeof IntersectionObserver === 'undefined') return;
    // Vùng quan sát = 35% trên cùng của khung nhìn: mép trên mục chạm vạch thì callback chạy.
    const io = new IntersectionObserver(measure, { rootMargin: '0px 0px -65% 0px' });
    targets.forEach((el) => io.observe(el));
    // Đáy trang: mục cuối có thể không chạm vạch.
    const tail = new IntersectionObserver(measure, { threshold: [0, 1] });
    const sentinel = document.getElementById('thong-tin-cuoi');
    if (sentinel) tail.observe(sentinel);
    window.addEventListener('resize', measure);
    return () => {
      io.disconnect();
      tail.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [items, measure]);

  // Chip đang đọc luôn nằm trong tầm nhìn của hàng cuộn ngang (mobile).
  useEffect(() => {
    const list = listRef.current;
    if (!list || !active || list.scrollWidth <= list.clientWidth) return;
    const el = list.querySelector<HTMLElement>('[aria-current="location"]');
    if (!el) return;
    const left = el.offsetLeft - (list.clientWidth - el.offsetWidth) / 2;
    list.scrollTo({ left, behavior: 'auto' });
  }, [active]);

  return (
    <nav className="ip-nav" aria-label={label}>
      <ul ref={listRef} className="ip-nav-list">
        {items.map((it) => (
          <li key={it.id}>
            <a
              href={`#${it.id}`}
              className="ip-nav-link"
              aria-current={active === it.id ? 'location' : undefined}
              onClick={() => setActive(it.id)}
            >
              {it.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
