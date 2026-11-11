/**
 * Tệp media của trang chủ. Thay tệp trong `public/media/` giữ nguyên tên là đủ, không cần sửa code
 * (xem `public/media/README.md`). Chỉ đổi file này khi đổi tên/đường dẫn hoặc có bản video mobile.
 */
export const media = {
  /** Video nền hero (MP4 H.264). */
  heroVideo: '/media/hero.mp4',
  /** Ảnh hiện ngay khi tải trang, và thay cho video khi giảm chuyển động / Save-Data / video lỗi. */
  heroPoster: '/media/hero-poster.jpg',
  /** Video có tiếng không? Đặt false thì ẩn nút bật/tắt âm thanh. */
  heroVideoHasAudio: true,
  /** Bản video riêng cho màn hình hẹp (dưới 768px). Chỉ dùng khi `heroVideoMobileExists` là true. */
  heroVideoMobile: '/media/hero-mobile.mp4',
  heroVideoMobileExists: false,
} as const;
