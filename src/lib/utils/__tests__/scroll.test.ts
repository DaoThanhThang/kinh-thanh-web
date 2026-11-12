import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { misalignment, samePageHashId, scrollToHash } from '../scroll';

describe('samePageHashId', () => {
  it('nhận #id, /#id ở trang chủ và /trang#id ở đúng trang đó', () => {
    expect(samePageHashId('#builder', '/')).toBe('builder');
    expect(samePageHashId('/#builder', '/')).toBe('builder');
    expect(samePageHashId('/thong-tin#hoi-dap', '/thong-tin')).toBe('hoi-dap');
    expect(samePageHashId('/thong-tin#hoi-dap', '/thong-tin/')).toBe('hoi-dap');
    expect(samePageHashId('#cau%20chuyen', '/lien-he')).toBe('cau chuyen');
  });

  it('khác trang hoặc không có hash → null (để router điều hướng)', () => {
    expect(samePageHashId('/#builder', '/lien-he')).toBeNull();
    expect(samePageHashId('/thong-tin#hoi-dap', '/')).toBeNull();
    expect(samePageHashId('/dat-hang', '/')).toBeNull();
    expect(samePageHashId('#', '/')).toBeNull();
    expect(samePageHashId('https://example.com/#x', '/')).toBeNull();
  });
});

describe('scrollToHash', () => {
  let el: HTMLElement;
  let top = 0;

  beforeEach(() => {
    vi.useFakeTimers();
    document.documentElement.style.scrollPaddingTop = '72px';
    el = document.createElement('section');
    el.id = 'builder';
    el.scrollIntoView = vi.fn();
    el.getBoundingClientRect = () => ({ top }) as DOMRect;
    document.body.append(el);
    window.scrollBy = vi.fn() as unknown as typeof window.scrollBy;
    window.history.replaceState(null, '', '/');
    top = 72;
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    el.remove();
    document.documentElement.style.scrollPaddingTop = '';
  });

  const reduced = (on: boolean) =>
    vi.stubGlobal('matchMedia', (q: string) => ({
      matches: on && q.includes('prefers-reduced-motion'),
      media: q,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }));

  it('không có phần tử → false, không làm gì', () => {
    expect(scrollToHash('khong-co')).toBe(false);
    expect(window.location.hash).toBe('');
  });

  it('cuộn mượt tới đầu phần tử, ghi hash vào lịch sử và đưa focus tới đích', () => {
    reduced(false);
    expect(scrollToHash('builder')).toBe(true);
    expect(el.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    expect(window.location.hash).toBe('#builder');
    expect(document.activeElement).toBe(el);
  });

  it('giảm chuyển động: cuộn tức thì (auto)', () => {
    reduced(true);
    scrollToHash('builder');
    expect(el.scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto', block: 'start' });
  });

  it('pushHash=false không đổi lịch sử', () => {
    scrollToHash('builder', { pushHash: false, behavior: 'auto' });
    expect(window.location.hash).toBe('');
  });

  it('căn lại khi bố cục dịch sau lần cuộn đầu (content-visibility)', () => {
    reduced(true);
    scrollToHash('builder');
    top = 72 + 310; // Story vừa vẽ xong, đích trôi xuống
    expect(misalignment(el)).toBe(310);
    vi.advanceTimersByTime(130);
    expect(window.scrollBy).toHaveBeenCalledWith({ top: 310, behavior: 'auto' });
  });

  it('đã đúng chỗ thì không cuộn thêm', () => {
    reduced(true);
    scrollToHash('builder');
    top = 74; // trong dung sai
    vi.advanceTimersByTime(2000);
    expect(window.scrollBy).not.toHaveBeenCalled();
  });

  it('người dùng tự cuộn (wheel) thì dừng căn lại', () => {
    reduced(true);
    scrollToHash('builder');
    top = 500;
    window.dispatchEvent(new Event('wheel'));
    vi.advanceTimersByTime(2000);
    expect(window.scrollBy).not.toHaveBeenCalled();
  });
});
