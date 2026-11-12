'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Logo } from '@/components/ui';
import { site } from '@/content/site';
import './site.css';

const DESKTOP_QUERY = '(min-width: 64rem)';
const nav = site.nav;

function Burger() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true">
      <g
        className="site-burger-bars"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="square"
      >
        <path d="M4 8.5h16" />
        <path d="M9 15.5h11" />
      </g>
      <g className="site-burger-x" stroke="currentColor" strokeWidth="1.25" strokeLinecap="square">
        <path d="M6 6l12 12" />
        <path d="M18 6L6 18" />
      </g>
    </svg>
  );
}

/**
 * Thanh đầu trang (cố định). Trong suốt ở đầu trang, cacao đặc + đường kẻ mảnh khi cuộn hoặc khi
 * menu mở (một IntersectionObserver trên phần tử mốc, không lắng nghe sự kiện cuộn).
 *
 * Từ 64rem: sáu liên kết phẳng trên MỘT dòng, căn phải, cùng cỡ chữ/đường cơ sở.
 * Dưới 64rem: nút menu mở tấm menu dưới thanh đầu, một danh sách phẳng (khoá cuộn nền, focus vào
 * menu, Esc/bấm ngoài đóng và trả focus). Không còn menu con, không có đăng nhập (D64).
 */
export function SiteHeader() {
  const pathname = usePathname();
  const sentinel = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [solid, setSolid] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([entry]) => entry && setSolid(!entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const closeMenu = useCallback((restoreFocus: boolean) => {
    setMenuOpen(false);
    if (restoreFocus) burgerRef.current?.focus({ preventScroll: true });
  }, []);

  // Menu mobile mở: khoá cuộn nền, focus vào menu, Esc, bấm ngoài, rời focus, đổi sang desktop.
  useEffect(() => {
    if (!menuOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.dataset.siteMenu = 'open';
    sheetRef.current?.querySelector<HTMLElement>('a[href]')?.focus({ preventScroll: true });

    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu(true);
    };
    const onPointer = (e: Event) => {
      if (!headerRef.current?.contains(e.target as Node)) closeMenu(true);
    };
    const mq = window.matchMedia?.(DESKTOP_QUERY);
    const onMq = () => {
      if (mq?.matches) closeMenu(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    mq?.addEventListener?.('change', onMq);
    return () => {
      document.body.style.overflow = prevOverflow;
      delete document.documentElement.dataset.siteMenu;
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
      mq?.removeEventListener?.('change', onMq);
    };
  }, [menuOpen, closeMenu]);

  const current = (href: string) => (href === pathname ? ('page' as const) : undefined);

  return (
    <>
      <div ref={sentinel} className="site-sentinel" aria-hidden="true" />
      <div className="site-backdrop" data-open={menuOpen ? 'true' : 'false'} aria-hidden="true" />
      <header
        ref={headerRef}
        className="site-header"
        data-solid={solid || menuOpen ? 'true' : 'false'}
        data-menu={menuOpen ? 'open' : 'closed'}
        onBlur={(e) => {
          if (menuOpen && e.relatedTarget && !e.currentTarget.contains(e.relatedTarget as Node))
            closeMenu(false);
        }}
      >
        <div className="site-header-inner">
          <Link
            href="/"
            className="site-logo"
            aria-label="Kinh Thành Chocolate, về trang chủ"
            onClick={() => closeMenu(false)}
          >
            <Logo size="xs" />
          </Link>

          <nav aria-label={nav.label} className="site-nav-desktop">
            <ul className="site-nav">
              {nav.items.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="site-link" aria-current={current(item.href)}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <button
            ref={burgerRef}
            type="button"
            className="site-burger"
            aria-expanded={menuOpen}
            aria-controls="site-menu"
            aria-label={menuOpen ? nav.closeMenu : nav.openMenu}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <Burger />
          </button>
        </div>

        <nav
          ref={sheetRef}
          id="site-menu"
          className="site-sheet"
          aria-label={nav.menuLabel}
          data-open={menuOpen}
          inert={!menuOpen}
        >
          <ul className="site-sheet-list">
            {nav.items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="site-sheet-link"
                  aria-current={current(item.href)}
                  onClick={() => closeMenu(false)}
                >
                  {item.menuLabel}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>
    </>
  );
}
