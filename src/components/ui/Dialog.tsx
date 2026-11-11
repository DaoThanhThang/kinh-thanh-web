'use client';

import { clsx } from 'clsx';
import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import './dialog.css';

export type DialogProps = {
  open: boolean;
  /** Gọi khi người dùng đóng (Esc, bấm nền mờ). Cha đặt `open` về false. */
  onClose: () => void;
  /** id của tiêu đề bên trong, dùng cho aria-labelledby. */
  titleId: string;
  /** `center`: giữa màn hình. `sheet`: bảng trượt từ đáy trên mobile, giữa màn hình từ 48rem. */
  variant?: 'center' | 'sheet';
  className?: string;
  children: ReactNode;
};

/**
 * Hộp thoại dựa trên <dialog> gốc: nền mờ, khoá focus, Esc đóng và trả focus đều do trình duyệt lo.
 * Phần tử có `data-autofocus` nhận focus đầu tiên (nếu không, phần tử focus được đầu tiên).
 * Nội dung chỉ được vẽ khi đang mở.
 */
export function Dialog({
  open,
  onClose,
  titleId,
  variant = 'center',
  className,
  children,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      if (typeof el.showModal === 'function') el.showModal();
      else el.setAttribute('open', '');
      el.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    } else if (!open && el.open) {
      if (typeof el.close === 'function') el.close();
      else el.removeAttribute('open');
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      data-variant={variant}
      className={clsx('kt-dialog', className)}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      {open ? children : null}
    </dialog>
  );
}
