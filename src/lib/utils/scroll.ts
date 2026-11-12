import { prefersReducedMotion } from './motion';

const trimPath = (p: string) => (p.length > 1 ? p.replace(/\/+$/, '') : p) || '/';

/**
 * Đường dẫn dạng `#id`, `/#id` hay `/trang#id` có cùng trang với `currentPathname` không?
 * Có → trả id (đã giải mã); không → null (để router đi tiếp).
 */
export function samePageHashId(href: string, currentPathname: string): string | null {
  const m = /^([^#?]*)#(.+)$/.exec(href);
  if (!m) return null;
  const path = m[1] ?? '';
  if (path !== '' && trimPath(path) !== trimPath(currentPathname)) return null;
  try {
    return decodeURIComponent(m[2] ?? '');
  } catch {
    return m[2] ?? null;
  }
}

export type ScrollToHashOptions = {
  /** Mặc định: `auto` khi giảm chuyển động, ngược lại `smooth`. */
  behavior?: ScrollBehavior;
  /** Ghi `#id` vào lịch sử (mặc định true). Đặt false khi chỉ căn lại sau điều hướng. */
  pushHash?: boolean;
};

/** Khoảng chừa dưới thanh đầu trang (scroll-padding-top của html), px. */
function headerOffset(): number {
  const raw = getComputedStyle(document.documentElement).scrollPaddingTop;
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : 0;
}

/** Độ lệch (px) giữa vị trí hiện tại của phần tử và vị trí đích (scroll-padding của html + scroll-margin của phần tử). */
export function misalignment(el: Element): number {
  const margin = parseFloat(getComputedStyle(el).scrollMarginTop);
  return el.getBoundingClientRect().top - headerOffset() - (Number.isFinite(margin) ? margin : 0);
}

const TOLERANCE = 4;

/**
 * Cuộn tới phần tử có id và căn lại nếu bố cục dịch chuyển sau đó (content-visibility, ảnh/video
 * tải xong...). Với `smooth` chờ hết hoạt ảnh mới đo; luôn căn lại bằng `auto`. Người dùng tự cuộn
 * (wheel/chạm) thì dừng căn lại. Trả false nếu không có phần tử.
 */
export function scrollToHash(id: string, opts: ScrollToHashOptions = {}): boolean {
  const el = document.getElementById(id);
  if (!el) return false;
  const behavior = opts.behavior ?? (prefersReducedMotion() ? 'auto' : 'smooth');
  el.scrollIntoView({ behavior, block: 'start' });

  if (opts.pushHash !== false && window.location.hash !== `#${id}`) {
    const { pathname, search } = window.location;
    window.history.pushState(null, '', `${pathname}${search}#${id}`);
  }

  // Đưa focus bàn phím tới đích (như điều hướng hash gốc) mà không cuộn thêm.
  if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
  el.focus({ preventScroll: true });

  const delays = behavior === 'smooth' ? [900, 1700] : [120, 600];
  const timers: number[] = [];
  const cancel = () => {
    timers.forEach((t) => window.clearTimeout(t));
    window.removeEventListener('wheel', cancel);
    window.removeEventListener('touchstart', cancel);
    window.removeEventListener('keydown', cancel);
  };
  window.addEventListener('wheel', cancel, { passive: true, once: true });
  window.addEventListener('touchstart', cancel, { passive: true, once: true });
  window.addEventListener('keydown', cancel, { once: true });
  delays.forEach((ms, i) =>
    timers.push(
      window.setTimeout(() => {
        const off = misalignment(el);
        if (Math.abs(off) > TOLERANCE) window.scrollBy({ top: off, behavior: 'auto' });
        if (i === delays.length - 1) cancel();
      }, ms),
    ),
  );
  return true;
}
