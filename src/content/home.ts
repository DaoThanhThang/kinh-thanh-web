import { siteConfig } from '@/config/site';

/** Chữ của trang chủ (tiếng Việt). Tách riêng để thêm ngôn ngữ khác sau. */
export const home = {
  brandName: siteConfig.name,
  tagline: siteConfig.tagline,
  heroLine: 'Chọn từng viên, xếp vào hộp quà của riêng bạn.',
  heroLabel: 'Hộp quà Kinh Thành',
  cta: 'Đặt hàng ngay',
  soundOn: 'Bật âm thanh',
  soundOff: 'Tắt âm thanh',
} as const;
