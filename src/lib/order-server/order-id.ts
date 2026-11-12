import { randomInt } from 'node:crypto';
import { shopDateParts } from './time';

/**
 * "KT-" + yyyymmdd (giờ Asia/Ho_Chi_Minh) + "-" + 4 chữ số ngẫu nhiên, ví dụ KT-20261111-0482.
 * Chưa có cơ sở dữ liệu nên không đảm bảo duy nhất tuyệt đối (10.000 mã mỗi ngày là quá đủ cho
 * một cửa hàng; trùng mã thì shop vẫn phân biệt được qua thời gian và tên khách).
 */
export function generateServerOrderId(
  now: Date = new Date(),
  random: () => number = () => randomInt(0, 10000),
): string {
  const p = shopDateParts(now);
  return `KT-${p.year}${p.month}${p.day}-${String(random()).padStart(4, '0')}`;
}
