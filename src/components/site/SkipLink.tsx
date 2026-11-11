import { site } from '@/content/site';

/** Liên kết đầu trang, chỉ hiện khi nhận focus bàn phím. Đích: `<main id="main">`. */
export function SkipLink() {
  return (
    <a href="#main" className="site-skip">
      {site.skipLink}
    </a>
  );
}
