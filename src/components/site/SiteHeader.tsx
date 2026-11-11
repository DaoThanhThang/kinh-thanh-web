'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Logo } from '@/components/ui';
import { site } from '@/content/site';
import './site.css';

/**
 * Thanh đầu trang (cố định). Trong suốt khi ở đầu trang; thành nền cacao đặc có đường kẻ mảnh khi
 * cuộn xuống. Trạng thái do một IntersectionObserver trên phần tử mốc ở đỉnh trang quyết định
 * (không lắng nghe sự kiện cuộn).
 */
export function SiteHeader() {
  const sentinel = useRef<HTMLDivElement>(null);
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([entry]) => entry && setSolid(!entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <>
      <div ref={sentinel} className="site-sentinel" aria-hidden="true" />
      <header className="site-header" data-solid={solid ? 'true' : 'false'}>
        <div className="site-header-inner">
          <Link href="/" className="site-logo" aria-label="Kinh Thành Chocolate, về trang chủ">
            <Logo size="xs" />
          </Link>
          <nav aria-label={site.nav.label}>
            <ul className="site-nav">
              <li>
                <Link href={site.nav.story.href} className="site-link">
                  {site.nav.story.label}
                </Link>
              </li>
              <li>
                <Link href={site.nav.builder.href} className="site-link">
                  {site.nav.builder.label}
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>
    </>
  );
}
