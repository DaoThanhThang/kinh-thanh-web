import { info } from '@/content/info';

/** Dòng nhỏ báo thông tin còn tạm (khi `placeholder` trong data/store-info.json là true). */
export function PlaceholderNotice({ show, className }: { show: boolean; className?: string }) {
  if (!show) return null;
  return (
    <p className={['site-notice', className].filter(Boolean).join(' ')}>{info.placeholderNotice}</p>
  );
}
