'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
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

function Chevron() {
  return (
    <svg
      className="site-chevron"
      viewBox="0 0 12 12"
      width="12"
      height="12"
      fill="none"
      aria-hidden="true"
    >
      <path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  );
}

/** "Đăng nhập": chưa có tính năng, là nút bị khoá (không phải liên kết) kèm chữ "Sắp ra mắt". */
function Login({ className }: { className?: string }) {
  return (
    <button
      type="button"
      className={['site-login', className].filter(Boolean).join(' ')}
      disabled
      aria-disabled="true"
    >
      <span>{nav.login.label}</span>
      <span className="site-login-soon">{nav.login.soon}</span>
    </button>
  );
}

/**
 * Thanh đầu trang (cố định). Trong suốt ở đầu trang, cacao đặc + đường kẻ mảnh khi cuộn hoặc khi
 * menu mở (một IntersectionObserver trên phần tử mốc, không lắng nghe sự kiện cuộn).
 *
 * Từ 64rem: liên kết nằm ngang, "Khác" là nút mở bảng con (Esc, bấm ngoài, rời focus thì đóng).
 * Dưới 64rem: nút menu mở tấm menu dưới thanh đầu (khoá cuộn nền, focus vào menu, đóng thì trả focus).
 */
export function SiteHeader() {
  const pathname = usePathname();
  const sentinel = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLLIElement>(null);
  const moreBtnRef = useRef<HTMLButtonElement>(null);
  const focusFirstMore = useRef(false);
  const [solid, setSolid] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

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
  const closeMore = useCallback((restoreFocus: boolean) => {
    setMoreOpen(false);
    if (restoreFocus) moreBtnRef.current?.focus({ preventScroll: true });
  }, []);

  // Menu mobile mở: khoá cuộn nền, focus vào menu, Esc, bấm ngoài, rời focus, đổi sang desktop.
  useEffect(() => {
    if (!menuOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
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
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
      mq?.removeEventListener?.('change', onMq);
    };
  }, [menuOpen, closeMenu]);

  // Bảng "Khác" (desktop) mở: Esc, bấm ngoài.
  useEffect(() => {
    if (!moreOpen) return;
    if (focusFirstMore.current) {
      focusFirstMore.current = false;
      moreRef.current?.querySelector<HTMLElement>('[role="menuitem"], a[href]')?.focus();
    }
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') closeMore(true);
    };
    const onPointer = (e: Event) => {
      if (!moreRef.current?.contains(e.target as Node)) closeMore(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [moreOpen, closeMore]);

  const onMoreKeyDown = (e: KeyboardEvent<HTMLLIElement>) => {
    const links = Array.from(
      moreRef.current?.querySelectorAll<HTMLElement>('.site-more-panel a') ?? [],
    );
    if (e.target === moreBtnRef.current && e.key === 'ArrowDown') {
      e.preventDefault();
      if (moreOpen) links[0]?.focus();
      else {
        focusFirstMore.current = true;
        setMoreOpen(true);
      }
      return;
    }
    if (!moreOpen || links.length === 0) return;
    const i = links.indexOf(e.target as HTMLElement);
    if (i < 0) return;
    const move = (n: number) => {
      e.preventDefault();
      links[(n + links.length) % links.length]?.focus();
    };
    if (e.key === 'ArrowDown') move(i + 1);
    else if (e.key === 'ArrowUp') move(i - 1);
    else if (e.key === 'Home') move(0);
    else if (e.key === 'End') move(links.length - 1);
  };

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
              <li
                ref={moreRef}
                className="site-more"
                onKeyDown={onMoreKeyDown}
                onBlur={(e) => {
                  if (moreOpen && !e.currentTarget.contains(e.relatedTarget as Node | null))
                    closeMore(false);
                }}
              >
                <button
                  ref={moreBtnRef}
                  type="button"
                  className="site-link site-more-btn"
                  aria-expanded={moreOpen}
                  aria-controls="site-more-panel"
                  onClick={() => setMoreOpen((o) => !o)}
                >
                  {nav.more.label}
                  <Chevron />
                </button>
                <ul
                  id="site-more-panel"
                  className="site-more-panel"
                  data-open={moreOpen}
                  inert={!moreOpen}
                >
                  {nav.more.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="site-more-link"
                        onClick={() => setMoreOpen(false)}
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
            <Login className="site-login-desktop" />
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
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <p className="site-sheet-group" id="site-sheet-more">
                {nav.more.label}
              </p>
              <ul className="site-sheet-sub" aria-labelledby="site-sheet-more">
                {nav.more.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="site-sheet-link site-sheet-sublink"
                      onClick={() => closeMenu(false)}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          </ul>
          <Login className="site-login-sheet" />
        </nav>
      </header>
    </>
  );
}
