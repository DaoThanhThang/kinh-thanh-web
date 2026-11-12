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
const moreButton = () => screen.getByRole('button', { name: 'Khác' });
const panel = () => document.getElementById('site-more-panel') as HTMLElement;

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

  it('liệt kê đủ mục, "Khác" mở sẵn thành nhóm, Đăng nhập khoá ở cuối', () => {
    render(<SiteHeader />);
    fireEvent.click(menuButton());
    const s = within(sheet());
    expect(s.getByRole('link', { name: 'Hộp quà' })).toHaveAttribute('href', '/#builder');
    expect(s.getByRole('link', { name: 'Liên hệ' })).toHaveAttribute('href', '/lien-he');
    expect(s.getByRole('link', { name: 'Câu hỏi thường gặp' })).toHaveAttribute(
      'href',
      '/thong-tin#hoi-dap',
    );
    expect(s.getByRole('link', { name: 'Giao hàng & đổi trả' })).toHaveAttribute(
      'href',
      '/thong-tin#giao-hang',
    );
    expect(s.getByRole('link', { name: 'Bảo quản chocolate' })).toHaveAttribute(
      'href',
      '/thong-tin#bao-quan',
    );
    expect(within(s.getByRole('list', { name: 'Khác' })).getAllByRole('link')).toHaveLength(3);
    const login = s.getByRole('button', { name: /Đăng nhập/ });
    expect(login).toBeDisabled();
    expect(login).toHaveAttribute('aria-disabled', 'true');
    expect(login).toHaveTextContent('Sắp ra mắt');
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
  it('có các liên kết chính', () => {
    render(<SiteHeader />);
    const nav = within(screen.getByRole('navigation', { name: 'Điều hướng chính' }));
    expect(nav.getByRole('link', { name: 'Câu chuyện' })).toHaveAttribute('href', '/#cau-chuyen');
    expect(nav.getByRole('link', { name: 'Hộp quà' })).toHaveAttribute('href', '/#builder');
    expect(nav.getByRole('link', { name: 'Liên hệ' })).toHaveAttribute('href', '/lien-he');
  });

  it('"Khác" đóng/mở bằng nút, có aria-expanded và aria-controls', () => {
    render(<SiteHeader />);
    expect(moreButton()).toHaveAttribute('aria-expanded', 'false');
    expect(moreButton()).toHaveAttribute('aria-controls', 'site-more-panel');
    expect(panel()).toHaveAttribute('inert');
    fireEvent.click(moreButton());
    expect(moreButton()).toHaveAttribute('aria-expanded', 'true');
    expect(panel()).not.toHaveAttribute('inert');
    expect(within(panel()).getAllByRole('link')).toHaveLength(3);
    fireEvent.click(moreButton());
    expect(moreButton()).toHaveAttribute('aria-expanded', 'false');
  });

  it('Esc đóng bảng con và trả focus về nút "Khác"', () => {
    render(<SiteHeader />);
    fireEvent.click(moreButton());
    within(panel()).getAllByRole('link')[0]?.focus();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(moreButton()).toHaveAttribute('aria-expanded', 'false');
    expect(moreButton()).toHaveFocus();
  });

  it('bấm ra ngoài hoặc rời focus thì đóng; chọn một mục cũng đóng', () => {
    render(<SiteHeader />);
    fireEvent.click(moreButton());
    fireEvent.pointerDown(document.body);
    expect(moreButton()).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(moreButton());
    fireEvent.blur(moreButton(), { relatedTarget: document.body });
    expect(moreButton()).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(moreButton());
    fireEvent.click(within(panel()).getByRole('link', { name: 'Bảo quản chocolate' }));
    expect(moreButton()).toHaveAttribute('aria-expanded', 'false');
  });

  it('mũi tên xuống mở bảng và nhảy vào mục đầu, mũi tên di chuyển giữa các mục', () => {
    render(<SiteHeader />);
    moreButton().focus();
    fireEvent.keyDown(moreButton(), { key: 'ArrowDown' });
    const links = within(panel()).getAllByRole('link');
    expect(links[0]).toHaveFocus();
    fireEvent.keyDown(links[0]!, { key: 'ArrowDown' });
    expect(links[1]).toHaveFocus();
    fireEvent.keyDown(links[1]!, { key: 'ArrowUp' });
    expect(links[0]).toHaveFocus();
  });

  it('Đăng nhập ở thanh desktop là nút khoá, không phải liên kết', () => {
    render(<SiteHeader />);
    const nav = within(screen.getByRole('navigation', { name: 'Điều hướng chính' }));
    const login = nav.getByRole('button', { name: /Đăng nhập/ });
    expect(login).toBeDisabled();
    expect(login).toHaveAttribute('aria-disabled', 'true');
    expect(nav.queryByRole('link', { name: /Đăng nhập/ })).not.toBeInTheDocument();
    expect(login).toHaveTextContent('Sắp ra mắt');
  });
});
