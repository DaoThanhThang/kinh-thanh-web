export const SHOP_TIME_ZONE = 'Asia/Ho_Chi_Minh';

export type ShopDateParts = {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
};

/** Các phần ngày giờ theo múi giờ cửa hàng (Asia/Ho_Chi_Minh), không phụ thuộc múi giờ máy chủ. */
export function shopDateParts(date: Date): ShopDateParts {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: SHOP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
  };
}

/** "14:05 · 12/11/2026" (giờ Việt Nam). */
export function formatShopDateTime(date: Date): string {
  const p = shopDateParts(date);
  return `${p.hour}:${p.minute} · ${p.day}/${p.month}/${p.year}`;
}

/** yyyy-mm-dd → dd/mm/yyyy (giữ nguyên nếu không đúng dạng). */
export function formatIsoDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}
