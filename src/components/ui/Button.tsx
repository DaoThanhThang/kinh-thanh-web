import Link from 'next/link';
import { clsx } from 'clsx';
import { forwardRef } from 'react';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';

type CommonProps = {
  /** `primary`: khung foil hai nét như tấm ép nhũ. `ghost`: chữ với gạch chân vẽ ra khi hover. */
  variant?: 'primary' | 'ghost';
  size?: 'md' | 'lg';
  /** Đang xử lý: hiện spinner, đặt aria-busy, chặn bấm nhưng vẫn giữ focus. */
  loading?: boolean;
  children: ReactNode;
};

type AsButton = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps> & { href?: undefined };
type AsLink = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof CommonProps> & {
    href: string;
    disabled?: boolean;
  };

export type ButtonProps = AsButton | AsLink;

const base =
  'type-label relative inline-flex select-none items-center justify-center gap-3 whitespace-nowrap ' +
  'transition-[transform,background-color,color,border-color,opacity] duration-(--duration-base) ease-out-expo ' +
  'aria-disabled:pointer-events-none aria-disabled:opacity-45 disabled:pointer-events-none disabled:opacity-45 aria-busy:cursor-progress';

const sizes = {
  md: 'min-h-12 px-7',
  lg: 'min-h-14 px-10',
} as const;

const variants = {
  primary: clsx(
    'rounded-sm border border-accent text-accent',
    // Nét foil mảnh thứ hai bên trong khung, như tấm đồng dập nổi.
    'before:pointer-events-none before:absolute before:inset-[3px] before:rounded-[1px] before:border before:border-accent/40 before:transition-colors before:duration-(--duration-base) before:content-[""]',
    'hover:-translate-y-px hover:bg-accent/15 hover:text-accent-bright hover:before:border-accent/70',
    'active:translate-y-px active:bg-accent/25 active:duration-(--duration-fast)',
  ),
  ghost: clsx(
    'px-1 text-accent',
    // Gạch chân luôn mờ, khi hover vẽ ra từ trái sang phải.
    'after:pointer-events-none after:absolute after:inset-x-1 after:bottom-2 after:h-px after:origin-left after:scale-x-100 after:bg-accent/35 after:content-[""]',
    'before:pointer-events-none before:absolute before:inset-x-1 before:bottom-2 before:z-10 before:h-px before:origin-left before:scale-x-0 before:bg-accent-bright before:transition-transform before:duration-(--duration-slow) before:ease-out-expo before:content-[""]',
    'hover:text-accent-bright hover:before:scale-x-100 active:translate-y-px',
  ),
} as const;

const ghostSizes = { md: 'min-h-12', lg: 'min-h-14' } as const;

function Spinner() {
  return (
    <svg
      viewBox="0 0 20 20"
      width="16"
      height="16"
      fill="none"
      aria-hidden="true"
      className="animate-spin"
      style={{ animationDuration: 'var(--duration-slower)' }}
    >
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      <path d="M10 2.5a7.5 7.5 0 0 1 7.5 7.5" stroke="currentColor" strokeWidth="1.25" />
      <path
        d="M10 5.2l.9 4.8-.9 4.8-.9-4.8z"
        stroke="currentColor"
        strokeWidth="0.75"
        opacity="0.7"
      />
    </svg>
  );
}

/**
 * Nút hành động. Có `href` thì hiển thị như liên kết (next/link), ngược lại là `<button>`.
 * Không gắn handler nội bộ nên dùng được trong Server Component. Trạng thái: hover (bước lên 1px), active (nhấn xuống), disabled, loading, focus-visible.
 */
export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  function Button(props, ref) {
    const {
      variant = 'primary',
      size = 'md',
      loading = false,
      className,
      children,
      ...rest
    } = props;
    const classes = clsx(
      base,
      variant === 'primary' ? sizes[size] : ghostSizes[size],
      variants[variant],
      className,
    );
    const content = (
      <>
        {loading ? <Spinner /> : null}
        <span>{children}</span>
      </>
    );

    if (props.href !== undefined) {
      const { href, disabled, onClick, ...anchor } = rest as Omit<AsLink, keyof CommonProps>;
      const inert = Boolean(disabled) || loading;
      return (
        <Link
          {...anchor}
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          className={classes}
          aria-disabled={inert || undefined}
          aria-busy={loading || undefined}
          tabIndex={inert ? -1 : anchor.tabIndex}
          onClick={inert ? undefined : onClick}
        >
          {content}
        </Link>
      );
    }

    const {
      disabled,
      onClick,
      type = 'button',
      ...native
    } = rest as Omit<AsButton, keyof CommonProps>;
    return (
      <button
        {...native}
        ref={ref as React.Ref<HTMLButtonElement>}
        type={type}
        className={classes}
        disabled={disabled}
        aria-busy={loading || undefined}
        aria-disabled={loading || undefined}
        onClick={loading ? undefined : onClick}
      >
        {content}
      </button>
    );
  },
);
