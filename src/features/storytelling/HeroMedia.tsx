'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { home } from '@/content/home';
import { HeroArt } from './HeroArt';
import { MQ_REDUCED, subscribeMotion } from './heroMotion';

type VideoProps = {
  poster: string;
  video: string;
  /** Bản video cho màn hình hẹp; không truyền thì dùng chung `video`. */
  videoMobile?: string;
  /** Video có tiếng: hiện nút bật/tắt âm thanh. */
  hasAudio: boolean;
};

type SaveDataNavigator = Navigator & { connection?: { saveData?: boolean } };

/** Có nên phát video không: không nếu giảm chuyển động hoặc bật tiết kiệm dữ liệu. */
function videoAllowed(): boolean {
  if (typeof window === 'undefined') return false;
  const reduced = typeof window.matchMedia === 'function' && window.matchMedia(MQ_REDUCED).matches;
  const saveData = (navigator as SaveDataNavigator).connection?.saveData === true;
  return !reduced && !saveData;
}

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z" />
      {muted ? (
        <path d="M16 9.5l4.5 5M20.5 9.5l-4.5 5" />
      ) : (
        <>
          <path d="M15.5 9a4 4 0 0 1 0 6" />
          <path d="M18 6.8a7.2 7.2 0 0 1 0 10.4" />
        </>
      )}
    </svg>
  );
}

type Props = VideoProps & {
  /** 'art' (mặc định ở `media.ts`): nền vẽ bằng mã, không có video. 'video': video + poster + nút tiếng. */
  mode?: 'art' | 'video';
  /** Ảnh tĩnh của nền art (chỉ dùng khi mode là 'art'). */
  art?: string;
};

/** Chọn nền hero theo `media.heroMode` (R2, D66). Chế độ video giữ nguyên hành vi R1. */
export function HeroMedia({ mode = 'video', art, ...video }: Props) {
  if (mode === 'art') return <HeroArt background={art ?? video.poster} />;
  return <HeroVideo {...video} />;
}

/**
 * Nền hero (chế độ video): ảnh poster hiện ngay (không chặn vẽ lần đầu), video phủ lên khi đã phát (mờ dần 600ms).
 * Giảm chuyển động / Save-Data → chỉ có ảnh, không gắn nguồn video. Video tạm dừng khi hero ra khỏi
 * khung nhìn hoặc tab bị ẩn. Âm thanh mặc định tắt; nút bật/tắt là một thao tác của người dùng.
 */
function HeroVideo({ poster, video, videoMobile, hasAudio }: VideoProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const allowed = useSyncExternalStore(subscribeMotion, videoAllowed, () => false);
  const [failed, setFailed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const showVideo = allowed && !failed;

  // Tạm dừng khi ngoài khung nhìn / tab ẩn (chỉ IntersectionObserver và visibilitychange, không bắt cuộn).
  useEffect(() => {
    const el = videoRef.current;
    const root = rootRef.current;
    if (!showVideo || !el || !root) return;
    let inView = true;
    const sync = () => {
      if (inView && !document.hidden) void el.play?.()?.catch?.(() => {});
      else el.pause?.();
    };
    let io: IntersectionObserver | undefined;
    if (typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver(([entry]) => {
        inView = entry ? entry.isIntersecting : true;
        sync();
      });
      io.observe(root);
    }
    document.addEventListener('visibilitychange', sync);
    return () => {
      io?.disconnect();
      document.removeEventListener('visibilitychange', sync);
    };
  }, [showVideo]);

  const toggleSound = () => {
    const el = videoRef.current;
    if (!el) return;
    const next = !el.muted;
    el.muted = next;
    setMuted(next);
    if (!next && el.paused) void el.play?.()?.catch?.(() => {});
  };

  return (
    <>
      <div ref={rootRef} className="hero-media" aria-hidden="true">
        {/* Ảnh LCP: có sẵn trong HTML từ server, ưu tiên cao. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="hero-poster"
          src={poster}
          alt=""
          width={1920}
          height={1080}
          fetchPriority="high"
          decoding="async"
        />
        {showVideo ? (
          <video
            ref={videoRef}
            className="hero-video"
            data-playing={playing ? 'true' : 'false'}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={poster}
            onPlaying={() => setPlaying(true)}
            onError={() => setFailed(true)}
          >
            {videoMobile ? (
              <source
                src={videoMobile}
                type="video/mp4"
                media="(max-width: 767px)"
                onError={() => setFailed(true)}
              />
            ) : null}
            <source src={video} type="video/mp4" onError={() => setFailed(true)} />
          </video>
        ) : null}
      </div>
      {hasAudio && showVideo ? (
        <button
          type="button"
          className="hero-sound"
          aria-pressed={!muted}
          aria-label={muted ? home.soundOn : home.soundOff}
          onClick={toggleSound}
        >
          <SpeakerIcon muted={muted} />
        </button>
      ) : null}
    </>
  );
}
