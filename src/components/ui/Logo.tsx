import { clsx } from 'clsx';

const sizes = {
  /** Một hàng ngang gọn (cổng thành + tên), dùng ở thanh đầu trang; không có dòng CHOCOLATE. */
  xs: { mark: 'w-7 sm:w-8', name: 'text-[0.8125rem] sm:text-[0.9375rem]', sub: '' },
  sm: { mark: 'w-10', name: 'text-[1.125rem]', sub: 'text-[0.625rem]' },
  md: { mark: 'w-16', name: 'text-[1.875rem]', sub: 'text-[0.6875rem]' },
  lg: {
    mark: 'w-24 sm:w-28',
    name: 'text-[2.25rem] sm:text-[3rem]',
    sub: 'text-[0.75rem] sm:text-[0.8125rem]',
  },
  /**
   * Co theo chiều rộng hộp quà (biến `--bw` của GiftBox), dùng trên nắp hộp. Chỉ dùng trong `.gb`.
   */
  fluid: {
    mark: 'w-[max(2.5rem,calc(var(--bw)*0.1))]',
    name: 'text-[max(0.8125rem,calc(var(--bw)*0.036))]',
    sub: 'text-[max(0.5rem,calc(var(--bw)*0.0155))]',
  },
} as const;

/** Cổng thành ba tầng mái, chỉ có nét (stroke), kế thừa màu foil qua currentColor. */
function CitadelGate({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 80"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {/* Đỉnh */}
      <path d="M60 6V2" />
      <path d="M44 13H76M44 13Q52 12 54 6H66Q68 12 76 13" />
      <path d="M50 13V21M70 13V21" />
      {/* Tầng hai */}
      <path d="M34 29H86M34 29Q44 28 47 21H73Q76 28 86 29" />
      <path d="M40 29V39M60 29V39M80 29V39" />
      {/* Tầng một */}
      <path d="M16 47H104M16 47Q27 46 30 39H90Q93 46 104 47" />
      <path d="M28 47V58M60 47V58M92 47V58" />
      {/* Tường và cổng vòm */}
      <path d="M12 78V58H108V78" />
      <path d="M50 78V70A10 10 0 0 1 70 70V78" />
      <path d="M4 78H116" />
    </svg>
  );
}

/**
 * Logo: cổng thành nét mảnh phía trên, "KINH THÀNH" (display, tracking rộng) và "CHOCOLATE" (nhỏ,
 * tracking rộng hơn). Màu foil. Một khối ảnh với aria-label.
 */
export function Logo({
  size = 'md',
  className,
}: {
  size?: keyof typeof sizes;
  className?: string;
}) {
  const s = sizes[size];
  if (size === 'xs') {
    return (
      <span
        role="img"
        aria-label="Kinh Thành Chocolate"
        className={clsx('inline-flex items-center gap-2.5 text-accent', className)}
      >
        <CitadelGate className={clsx('h-auto shrink-0', s.mark)} />
        <span
          aria-hidden="true"
          className={clsx(
            'font-serif leading-none font-semibold tracking-[0.2em] whitespace-nowrap uppercase',
            s.name,
          )}
        >
          Kinh Thành
        </span>
      </span>
    );
  }
  return (
    <span
      role="img"
      aria-label="Kinh Thành Chocolate"
      className={clsx('inline-flex flex-col items-center text-accent', className)}
    >
      <CitadelGate className={clsx('mb-3 h-auto', s.mark)} />
      {/* padding-left bù khoảng tracking cuối dòng để chữ cân giữa. */}
      <span
        aria-hidden="true"
        className={clsx(
          'pl-[0.22em] font-serif leading-none font-semibold tracking-[0.22em] whitespace-nowrap uppercase',
          s.name,
        )}
      >
        Kinh Thành
      </span>
      <span
        aria-hidden="true"
        className={clsx(
          'mt-2 pl-[0.5em] font-sans leading-none font-normal tracking-[0.5em] uppercase',
          s.sub,
        )}
      >
        Chocolate
      </span>
    </span>
  );
}
