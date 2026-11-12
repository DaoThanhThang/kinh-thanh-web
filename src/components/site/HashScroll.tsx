'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { samePageHashId, scrollToHash } from '@/lib/utils/scroll';

/**
 * Xử lý mọi liên kết neo trong trang (`#id`, `/#id`, `/trang#id`) bằng một listener ở document,
 * nên Hero/Story (server) và thanh đầu/chân trang đều dùng chung. Cùng trang → cuộn tới phần tử
 * (mượt, trừ khi giảm chuyển động) và cập nhật hash; khác trang → để next/link điều hướng rồi căn
 * lại khi trang mới đã có hash. preventDefault đủ để next/link bỏ qua (nó kiểm tra defaultPrevented).
 */
export function HashScroll() {
  const pathname = usePathname();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
        return;
      const a = (e.target as Element | null)?.closest?.('a[href]');
      if (!a || (a.getAttribute('target') ?? '_self') !== '_self' || a.hasAttribute('download'))
        return;
      const id = samePageHashId(a.getAttribute('href') ?? '', window.location.pathname);
      if (!id) return;
      if (scrollToHash(id)) e.preventDefault();
    };
    // Pha capture: chạy trước onClick của next/link (gắn ở gốc React).
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  // Điều hướng sang trang khác kèm hash, hoặc mở thẳng /#builder: căn lại khi bố cục đã ổn định.
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (!id) return;
    const raf = requestAnimationFrame(() => {
      let key = id;
      try {
        key = decodeURIComponent(id);
      } catch {
        /* giữ nguyên */
      }
      scrollToHash(key, { behavior: 'auto', pushHash: false });
    });
    return () => cancelAnimationFrame(raf);
  }, [pathname]);

  return null;
}
