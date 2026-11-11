import { clsx } from 'clsx';
import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';

type Level = 'h1' | 'h2' | 'h3' | 'h4';
type Role = 'display' | 'title' | 'heading';

export type HeadingProps = HTMLAttributes<HTMLHeadingElement> & {
  /** Thẻ ngữ nghĩa. */
  as?: Level;
  /** Vai trò chữ (kích thước/kiểu); độc lập với cấp thẻ. */
  role?: Role;
};

const defaultRole: Record<Level, Role> = {
  h1: 'display',
  h2: 'title',
  h3: 'heading',
  h4: 'heading',
};

const roleClass: Record<Role, string> = {
  display: 'type-display',
  title: 'type-title',
  heading: 'type-heading',
};

/**
 * Tiêu đề serif. `as` chọn h1–h4, `role` chọn display / title / heading.
 * Mặc định: h1 = display, h2 = title, h3/h4 = heading. Xuống dòng cân bằng (text-wrap: balance).
 */
export const Heading = forwardRef<HTMLHeadingElement, HeadingProps>(function Heading(
  { as = 'h2', role, className, ...rest },
  ref,
) {
  const Tag = as;
  // `role` ở đây là vai trò chữ, không phải ARIA role: không chuyển xuống DOM.
  return (
    <Tag ref={ref} className={clsx(roleClass[role ?? defaultRole[as]], className)} {...rest} />
  );
});
