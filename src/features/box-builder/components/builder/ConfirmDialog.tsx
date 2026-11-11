'use client';

import { useId } from 'react';
import { Button, Heading, Text } from '@/components/ui';
import { Dialog } from '@/components/ui/Dialog';

export type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

/** Hộp xác nhận hai nút. Focus mặc định rơi vào nút giữ nguyên (an toàn hơn). */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId();
  return (
    <Dialog open={open} onClose={onCancel} titleId={titleId} variant="center">
      <div className="flex flex-col gap-5 p-6 sm:p-8">
        <Heading as="h3" id={titleId}>
          {title}
        </Heading>
        <Text>{message}</Text>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onCancel} data-autofocus>
            {cancelLabel}
          </Button>
          <Button onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </Dialog>
  );
}
