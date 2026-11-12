/**
 * Tệp media của trang chủ. Thay tệp trong `public/media/` giữ nguyên tên là đủ, không cần sửa code
 * (xem `public/media/README.md`). Chỉ đổi file này khi đổi tên/đường dẫn hoặc có bản video mobile.
 */
export type HeroMode = 'art' | 'video';

export const media = {
  /**
   * Nền hero. 'art' (mặc định): ảnh tĩnh `heroArt` + vòng/chim xoay bằng mã, KHÔNG có video và không
   * có nút âm thanh. 'video': video `heroVideo` + poster + nút âm thanh (xem `public/media/README.md`).
   */
  heroMode: 'art' as HeroMode,
  /** Ảnh tĩnh của nền art (thành, đồi, sóng; không có vòng và chim). */
  heroArt: '/media/hero-citadel.jpg',
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
