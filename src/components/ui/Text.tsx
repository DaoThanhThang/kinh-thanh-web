import { clsx } from 'clsx';
import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';

type Role = 'lead' | 'body' | 'small';

export type TextProps = HTMLAttributes<HTMLParagraphElement> & {
  as?: 'p' | 'span' | 'div';
  /** lead: serif nghiêng cho câu dẫn/tagline. body: đoạn văn. small: chú thích. */
  role?: Role;
  /** muted: chữ phụ, ngả ấm (ivory-400). error: thông báo lỗi. */
  tone?: 'default' | 'muted' | 'error';
};

const roleClass: Record<Role, string> = {
  lead: 'type-lead',
  body: 'type-body',
  small: 'type-small',
};

const toneClass = {
  default: 'text-text',
  muted: 'text-text-muted',
  error: 'text-error',
} as const;

/** Đoạn văn. Body và small giới hạn 65ch; lead dùng serif nghiêng. */
export const Text = forwardRef<HTMLParagraphElement, TextProps>(function Text(
  { as: Tag = 'p', role = 'body', tone = 'default', className, ...rest },
  ref,
) {
  return <Tag ref={ref} className={clsx(roleClass[role], toneClass[tone], className)} {...rest} />;
});
