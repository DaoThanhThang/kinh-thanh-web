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
    contact: { href: '/lien-he', label: 'Liên hệ' },
    info: { href: '/thong-tin', label: 'Thông tin' },
    /** Mục trên thanh đầu trang (desktop và menu mobile). `group` = menu con "Khác". */
    items: [
      { href: '/#cau-chuyen', label: 'Câu chuyện' },
      { href: '/#builder', label: 'Hộp quà' },
      { href: '/lien-he', label: 'Liên hệ' },
    ],
    more: {
      label: 'Khác',
      items: [
        { href: '/thong-tin#hoi-dap', label: 'Câu hỏi thường gặp' },
        { href: '/thong-tin#giao-hang', label: 'Giao hàng & đổi trả' },
        { href: '/thong-tin#bao-quan', label: 'Bảo quản chocolate' },
      ],
    },
    login: { label: 'Đăng nhập', soon: 'Sắp ra mắt' },
    menuLabel: 'Menu',
    openMenu: 'Mở menu',
    closeMenu: 'Đóng menu',
  },
  footer: {
    navLabel: 'Liên kết',
    rights: (year: number) => `© ${year} Kinh Thành Chocolate.`,
  },
  notFound: {
    title: 'Không tìm thấy trang',
    heading: 'Trang này không có ở đây',
    body: 'Đường dẫn có thể đã đổi hoặc gõ chưa đúng. Hãy quay về trang chủ để tiếp tục chọn hộp quà.',
    home: 'Về trang chủ',
  },
} as const;
