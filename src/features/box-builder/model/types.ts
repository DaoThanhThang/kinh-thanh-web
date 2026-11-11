/** Vị trí ô trong hộp, tính từ 0 theo thứ tự hàng (trái → phải, trên → dưới). */
export type SlotIndex = number;

/** Mỗi phần tử là id chocolate hoặc null (ô trống). Độ dài luôn bằng size hộp. */
export type Slots = (string | null)[];

export type BoxState = {
  /** Size hộp đã chọn; null = chưa chọn. */
  size: number | null;
  slots: Slots;
  message: string;
  /** Người gửi / người nhận in trên thiệp (tuỳ chọn, ≤ 40 ký tự mỗi ô). */
  from: string;
  to: string;
};
