/** Trạng thái cuộn của vùng danh sách trong khay (R3, D68). */
export type ScrollEdges = {
  /** Nội dung dài hơn khung nhìn. */
  overflow: boolean;
  /** Còn nội dung phía trên (đã cuộn xuống). */
  moreAbove: boolean;
  /** Còn nội dung phía dưới. */
  moreBelow: boolean;
};

/** Dung sai (px) cho sai số làm tròn của scrollTop khi zoom / màn hình độ phân giải lẻ. */
const EPSILON = 2;

/** Hàm thuần: từ số đo của phần tử cuộn suy ra còn nội dung ở phía nào. */
export function scrollEdges(
  scrollTop: number,
  clientHeight: number,
  scrollHeight: number,
): ScrollEdges {
  const overflow = scrollHeight - clientHeight > EPSILON;
  if (!overflow) return { overflow: false, moreAbove: false, moreBelow: false };
  return {
    overflow: true,
    moreAbove: scrollTop > EPSILON,
    moreBelow: scrollTop + clientHeight < scrollHeight - EPSILON,
  };
}
