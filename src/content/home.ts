import { siteConfig } from '@/config/site';

/** Chữ của trang chủ (tiếng Việt). Tách riêng để thêm ngôn ngữ khác sau. */
export const home = {
  tagline: siteConfig.tagline,
  heroLine: 'Chọn từng viên, xếp vào hộp quà của riêng bạn.',
  heroLabel: 'Hộp quà Kinh Thành',
  sceneLabel: 'Hộp quà Kinh Thành mở nắp, khay vàng còn trống',
  cta: 'Tự tay chọn hộp quà',
} as const;
