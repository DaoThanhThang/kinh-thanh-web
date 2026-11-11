import { siteConfig } from '@/config/site';

/** Chữ của thanh đầu trang, chân trang, trang 404 và metadata (tiếng Việt). */
export const site = {
  brand: 'Kinh Thành Chocolate',
  description: `${siteConfig.tagline}. Tự tay chọn từng viên chocolate, xếp vào hộp quà của riêng bạn.`,
  skipLink: 'Bỏ qua tới nội dung chính',
  nav: {
    label: 'Điều hướng chính',
    story: { href: '/#cau-chuyen', label: 'Câu chuyện' },
    builder: { href: '/#builder', label: 'Chọn hộp quà' },
    order: { href: '/dat-hang', label: 'Đặt hàng' },
  },
  footer: {
    navLabel: 'Liên kết',
    contact: 'Thông tin liên hệ đang được cập nhật.',
    rights: (year: number) => `© ${year} Kinh Thành Chocolate.`,
  },
  notFound: {
    title: 'Không tìm thấy trang',
    heading: 'Trang này không có ở đây',
    body: 'Đường dẫn có thể đã đổi hoặc gõ chưa đúng. Hãy quay về trang chủ để tiếp tục chọn hộp quà.',
    home: 'Về trang chủ',
  },
} as const;
