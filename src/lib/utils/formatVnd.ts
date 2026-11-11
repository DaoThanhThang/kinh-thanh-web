const formatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

/** Định dạng số thành tiền VND, ví dụ 350000 -> "350.000 ₫". */
export function formatVnd(amount: number): string {
  return formatter.format(amount).replace(/[  ]/g, ' ');
}
