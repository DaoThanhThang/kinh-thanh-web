import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { home } from '@/content/home';
import { Hero } from '../Hero';
import { HeroMedia } from '../HeroMedia';

const mockMotion = (reduced: boolean) =>
  vi.stubGlobal('matchMedia', (q: string) => ({
    matches: reduced && q.includes('prefers-reduced-motion'),
    media: q,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));

const props = { poster: '/media/p.jpg', video: '/media/v.mp4', hasAudio: true };
const videoEl = () => document.querySelector('video') as HTMLVideoElement;

beforeEach(() => {
  mockMotion(false);
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Hero', () => {
  it('có đúng một h1, slogan và nút "Đặt hàng ngay" trỏ tới #builder', () => {
    render(<Hero cols={4} rows={3} />);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Kinh Thành');
    expect(screen.getByText(home.tagline, { selector: '.hero-slogan' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Đặt hàng ngay' })).toHaveAttribute('href', '#builder');
  });
});

describe('HeroMedia: nút âm thanh', () => {
  it('mặc định tắt tiếng; bấm thì bật tiếng, aria-pressed và nhãn đổi theo', () => {
    render(<HeroMedia {...props} />);
    const video = videoEl();
    const btn = screen.getByRole('button', { name: 'Bật âm thanh' });
    expect(video.muted).toBe(true);
    expect(btn).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(btn);
    expect(video.muted).toBe(false);
    const on = screen.getByRole('button', { name: 'Tắt âm thanh' });
    expect(on).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(on);
    expect(video.muted).toBe(true);
    expect(screen.getByRole('button', { name: 'Bật âm thanh' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('ẩn nút khi video không có tiếng', () => {
    render(<HeroMedia {...props} hasAudio={false} />);
    expect(videoEl()).not.toBeNull();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('ẩn nút và video khi video lỗi, vẫn còn ảnh poster', () => {
    render(<HeroMedia {...props} />);
    fireEvent.error(videoEl());
    expect(videoEl()).toBeNull();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(document.querySelector('img.hero-poster')).toHaveAttribute('src', props.poster);
  });
});

describe('HeroMedia: giảm chuyển động / tiết kiệm dữ liệu', () => {
  it('prefers-reduced-motion: chỉ ảnh poster, không có video, không có nút', () => {
    mockMotion(true);
    const { container } = render(<HeroMedia {...props} />);
    expect(container.querySelector('img.hero-poster')).toHaveAttribute('src', props.poster);
    expect(container.querySelector('video')).toBeNull();
    expect(container.querySelector('source')).toBeNull();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('Save-Data: chỉ ảnh poster, không gắn nguồn video', () => {
    vi.stubGlobal('navigator', { ...navigator, connection: { saveData: true } });
    const { container } = render(<HeroMedia {...props} />);
    expect(container.querySelector('img.hero-poster')).not.toBeNull();
    expect(container.querySelector('video')).toBeNull();
  });
});

describe('HeroMedia: tạm dừng khi ra khỏi khung nhìn', () => {
  it('pause khi hero ra ngoài, play khi quay lại', () => {
    let cb: IntersectionObserverCallback = () => undefined;
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(c: IntersectionObserverCallback) {
          cb = c;
        }
        observe() {}
        disconnect() {}
        unobserve() {}
      },
    );
    render(<HeroMedia {...props} />);
    const fire = (isIntersecting: boolean) =>
      cb([{ isIntersecting } as IntersectionObserverEntry], {} as IntersectionObserver);
    fire(false);
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled();
    fire(true);
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalled();
  });

  it('chỉ có nguồn mobile khi được truyền vào', () => {
    const { container, rerender } = render(<HeroMedia {...props} />);
    expect(container.querySelectorAll('source')).toHaveLength(1);
    rerender(<HeroMedia {...props} videoMobile="/media/m.mp4" />);
    const sources = container.querySelectorAll('source');
    expect(sources).toHaveLength(2);
    expect(sources[0]).toHaveAttribute('media', '(max-width: 767px)');
  });
});
