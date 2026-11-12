import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SiteHeader } from '../SiteHeader';

vi.mock('next/navigation', () => ({ usePathname: () => '/' }));

beforeEach(() => {
  vi.stubGlobal('matchMedia', (q: string) => ({
    matches: false,
    media: q,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  document.body.style.overflow = '';
});

const menuButton = () => screen.getByRole('button', { name: /menu/i });
const sheet = () => document.getElementById('site-menu') as HTMLElement;

describe('SiteHeader: menu mobile', () => {
  it('đóng mặc định: aria-expanded=false, tấm menu inert, thân trang cuộn được', () => {
    render(<SiteHeader />);
    expect(menuButton()).toHaveAttribute('aria-expanded', 'false');
    expect(menuButton()).toHaveAttribute('aria-controls', 'site-menu');
    expect(menuButton()).toHaveAccessibleName('Mở menu');
    expect(sheet()).toHaveAttribute('inert');
    expect(document.body.style.overflow).toBe('');
  });

  it('mở: đổi nhãn, bỏ inert, khoá cuộn nền, focus vào mục đầu, header đặc', () => {
    render(<SiteHeader />);
    fireEvent.click(menuButton());
    expect(menuButton()).toHaveAttribute('aria-expanded', 'true');
    expect(menuButton()).toHaveAccessibleName('Đóng menu');
    expect(sheet()).not.toHaveAttribute('inert');
    expect(document.body.style.overflow).toBe('hidden');
    expect(within(sheet()).getByRole('link', { name: 'Câu chuyện' })).toHaveFocus();
    expect(document.querySelector('.site-header')).toHaveAttribute('data-solid', 'true');
  });

  it('liệt kê sáu mục thành MỘT danh sách phẳng, nhãn dài, không nhóm con, không đăng nhập', () => {
    render(<SiteHeader />);
    fireEvent.click(menuButton());
    const s = within(sheet());
    const links = s.getAllByRole('link');
    expect(links.map((l) => [l.textContent, l.getAttribute('href')])).toEqual([
      ['Câu chuyện', '/#cau-chuyen'],
      ['Hộp quà', '/#builder'],
      ['Liên hệ', '/lien-he'],
      ['Câu hỏi thường gặp', '/thong-tin#hoi-dap'],
      ['Giao hàng & đổi trả', '/thong-tin#giao-hang'],
      ['Bảo quản chocolate', '/thong-tin#bao-quan'],
    ]);
    expect(s.getAllByRole('list')).toHaveLength(1);
    expect(s.queryByRole('button')).not.toBeInTheDocument();
    expect(sheet().textContent).not.toMatch(/Đăng nhập|Sắp ra mắt|Khác/);
  });

  it('Esc đóng, trả focus về nút menu, mở lại cuộn nền', () => {
    render(<SiteHeader />);
    fireEvent.click(menuButton());
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(menuButton()).toHaveAttribute('aria-expanded', 'false');
    expect(menuButton()).toHaveFocus();
    expect(sheet()).toHaveAttribute('inert');
    expect(document.body.style.overflow).toBe('');
  });

  it('bấm ra ngoài đóng menu và trả focus', () => {
    render(<SiteHeader />);
    fireEvent.click(menuButton());
    fireEvent.pointerDown(document.body);
    expect(menuButton()).toHaveAttribute('aria-expanded', 'false');
    expect(menuButton()).toHaveFocus();
  });

  it('chạm một mục thì menu đóng', () => {
    render(<SiteHeader />);
    fireEvent.click(menuButton());
    fireEvent.click(within(sheet()).getByRole('link', { name: 'Liên hệ' }));
    expect(menuButton()).toHaveAttribute('aria-expanded', 'false');
    expect(document.body.style.overflow).toBe('');
  });

  it('menu mở đặt data-site-menu trên <html> (ẩn nút chat), đóng thì gỡ', () => {
    render(<SiteHeader />);
    fireEvent.click(menuButton());
    expect(document.documentElement.dataset.siteMenu).toBe('open');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(document.documentElement.dataset.siteMenu).toBeUndefined();
  });

  it('bấm nút menu lần nữa thì đóng', () => {
    render(<SiteHeader />);
    fireEvent.click(menuButton());
    fireEvent.click(menuButton());
    expect(menuButton()).toHaveAttribute('aria-expanded', 'false');
  });

  it('chuyển sang màn hình desktop khi đang mở thì đóng', () => {
    let listener: () => void = () => undefined;
    const mq = {
      matches: false,
      media: '',
      addEventListener: (_: string, cb: () => void) => (listener = cb),
      removeEventListener: () => undefined,
    };
    vi.stubGlobal('matchMedia', () => mq);
    render(<SiteHeader />);
    fireEvent.click(menuButton());
    mq.matches = true;
    act(() => listener());
    expect(menuButton()).toHaveAttribute('aria-expanded', 'false');
  });
});

describe('SiteHeader: desktop', () => {
  it('sáu liên kết phẳng, nhãn ngắn, đúng thứ tự và đích', () => {
    render(<SiteHeader />);
    const nav = within(screen.getByRole('navigation', { name: 'Điều hướng chính' }));
    expect(nav.getAllByRole('link').map((l) => [l.textContent, l.getAttribute('href')])).toEqual([
      ['Câu chuyện', '/#cau-chuyen'],
      ['Hộp quà', '/#builder'],
      ['Liên hệ', '/lien-he'],
      ['Hỏi đáp', '/thong-tin#hoi-dap'],
      ['Giao hàng', '/thong-tin#giao-hang'],
      ['Bảo quản', '/thong-tin#bao-quan'],
    ]);
  });

  it('không còn menu thả xuống "Khác" hay nút Đăng nhập ở đâu cả', () => {
    const { container } = render(<SiteHeader />);
    expect(screen.queryByRole('button', { name: 'Khác' })).not.toBeInTheDocument();
    expect(screen.queryByText(/Đăng nhập|Sắp ra mắt/)).not.toBeInTheDocument();
    expect(container.querySelector('[aria-expanded][aria-controls="site-more-panel"]')).toBeNull();
    expect(container.querySelector('.site-more-panel, .site-login')).toBeNull();
    // Chỉ còn nút menu mobile là nút có aria-expanded.
    expect(container.querySelectorAll('button[aria-expanded]')).toHaveLength(1);
  });
});
