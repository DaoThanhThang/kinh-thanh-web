import type { CSSProperties } from 'react';

/** Chim Lạc bay, nét mảnh: thân cổ dài, hai cánh vuốt, đuôi nhọn. Hướng mặc định: bay sang phải. */
export function LacBird({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg
      viewBox="0 0 100 56"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      style={{ strokeWidth: 'var(--foil-w, 1.1px)', ...style }}
    >
      {/* Thân, cổ, đầu và mỏ */}
      <path d="M6 36Q28 33 50 29Q66 26 74 17" vectorEffect="non-scaling-stroke" />
      <path d="M74 17Q79 15 86 19L77 20" vectorEffect="non-scaling-stroke" />
      {/* Đuôi */}
      <path d="M6 36L0 42M6 36L2 34" vectorEffect="non-scaling-stroke" />
      {/* Cánh trên: ba đường lông */}
      <path d="M46 29C44 14 28 5 6 3" vectorEffect="non-scaling-stroke" />
      <path d="M48 29C42 16 30 11 14 9" vectorEffect="non-scaling-stroke" opacity="0.7" />
      <path d="M50 29C46 20 38 16 28 15" vectorEffect="non-scaling-stroke" opacity="0.5" />
      {/* Cánh dưới */}
      <path d="M50 30C56 42 46 52 26 55" vectorEffect="non-scaling-stroke" />
      <path d="M52 31C54 40 46 47 34 49" vectorEffect="non-scaling-stroke" opacity="0.6" />
    </svg>
  );
}
