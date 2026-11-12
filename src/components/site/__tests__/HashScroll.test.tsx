import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { HashScroll } from '../HashScroll';

vi.mock('next/navigation', () => ({ usePathname: () => '/' }));

let target: HTMLElement;
beforeEach(() => {
  vi.stubGlobal('matchMedia', (q: string) => ({ matches: false, media: q }));
  target = document.createElement('section');
  target.id = 'builder';
  target.scrollIntoView = vi.fn();
  document.body.append(target);
  window.history.replaceState(null, '', '/');
});
afterEach(() => {
  cleanup();
  target.remove();
  vi.unstubAllGlobals();
});

describe('HashScroll', () => {
  it('bấm neo cùng trang: cuộn tới đích, preventDefault, ghi hash', () => {
    const { getByRole } = render(
      <>
        <HashScroll />
        <Button href="#builder">Đặt hàng ngay</Button>
      </>,
    );
    const ok = fireEvent.click(getByRole('link', { name: 'Đặt hàng ngay' }));
    expect(ok).toBe(false); // đã preventDefault
    expect(target.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    expect(window.location.hash).toBe('#builder');
  });

  it('/#builder ở trang chủ cũng được xử lý; trang khác hoặc đích không tồn tại thì không', () => {
    const { container } = render(
      <>
        <HashScroll />
        <Link href="/#builder">a</Link>
        <a href="/lien-he">b</a>
        <a href="#khong-co">c</a>
      </>,
    );
    const [a, b, c] = Array.from(container.querySelectorAll('a'));
    expect(fireEvent.click(a!)).toBe(false);
    expect(fireEvent.click(b!)).toBe(true);
    expect(fireEvent.click(c!)).toBe(true);
  });

  it('bỏ qua bấm có phím bổ trợ (mở tab mới)', () => {
    const { getByText } = render(
      <>
        <HashScroll />
        <a href="#builder">x</a>
      </>,
    );
    expect(fireEvent.click(getByText('x'), { ctrlKey: true })).toBe(true);
    expect(target.scrollIntoView).not.toHaveBeenCalled();
  });
});

describe('Button với href "#id"', () => {
  it('là thẻ <a> thường', () => {
    const { getByRole } = render(<Button href="#builder">Đi</Button>);
    expect(getByRole('link', { name: 'Đi' })).toHaveAttribute('href', '#builder');
  });
});
