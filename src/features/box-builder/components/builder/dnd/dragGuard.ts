/**
 * Sau khi kéo xong, trình duyệt có thể bắn thêm một "click" (thả lên đúng nút đã nhấc, hoặc
 * Space nhả phím). Bỏ qua click trong khoảng ngắn đó để không bật menu / đổi trạng thái cầm.
 */
let lastEnd = 0;
export const markDragEnded = () => {
  lastEnd = Date.now();
};
export const justDragged = () => Date.now() - lastEnd < 350;
