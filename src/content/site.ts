import { siteConfig } from '@/config/site';

/** Chữ của thanh đầu trang, chân trang, trang 404 và metadata (tiếng Việt). */
export const site = {
  brand: 'Kinh Thành Chocolate',
  description: `${siteConfig.tagline}. Tự tay chọn từng viên chocolate, xếp vào hộp quà của riêng bạn.`,
  skipLink: 'Bỏ qua tới nội dung chính',
  nav: {
    label: 'Điều hướng chính',
    /**
     * Sáu mục, một dòng duy nhất ở desktop (`label` ngắn) và một danh sách phẳng ở menu mobile
     * (`menuLabel` đầy đủ). Không còn nhóm con, không có đăng nhập (R2, D64).
     */
    items: [
      { href: '/#cau-chuyen', label: 'Câu chuyện', menuLabel: 'Câu chuyện' },
      { href: '/#builder', label: 'Hộp quà', menuLabel: 'Hộp quà' },
      { href: '/lien-he', label: 'Liên hệ', menuLabel: 'Liên hệ' },
      { href: '/thong-tin#hoi-dap', label: 'Hỏi đáp', menuLabel: 'Câu hỏi thường gặp' },
      { href: '/thong-tin#giao-hang', label: 'Giao hàng', menuLabel: 'Giao hàng & đổi trả' },
      { href: '/thong-tin#bao-quan', label: 'Bảo quản', menuLabel: 'Bảo quản chocolate' },
    ],
    menuLabel: 'Menu',
    openMenu: 'Mở menu',
    closeMenu: 'Đóng menu',
  },
  footer: {
    rights: (year: number) => `© ${year} Kinh Thành Chocolate`,
  },
  notFound: {
    title: 'Không tìm thấy trang',
    heading: 'Trang này không có ở đây',
    body: 'Đường dẫn có thể đã đổi hoặc gõ chưa đúng. Hãy quay về trang chủ để tiếp tục chọn hộp quà.',
    home: 'Về trang chủ',
  },
} as const;
