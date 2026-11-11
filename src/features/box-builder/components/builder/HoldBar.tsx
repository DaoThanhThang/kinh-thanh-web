'use client';

import { builder as t } from '@/content/builder';

/** Thanh gợi ý khi đang cầm một viên (chạm-để-đặt). Luôn hiện cho tới khi bấm Huỷ/Xong hoặc hộp đầy. */
export function HoldBar({
  name,
  placed,
  onDone,
}: {
  name: string;
  /** Số viên đã đặt từ lúc cầm. */
  placed: number;
  onDone: () => void;
}) {
  return (
    <div className="bb-hold" role="group" aria-label={t.holdGroupLabel}>
      <p className="bb-hold-text">{placed > 0 ? t.holdHintMore(name) : t.holdHint(name)}</p>
      <button type="button" className="bb-hold-btn" onClick={onDone}>
        {placed > 0 ? t.holdDone : t.holdCancel}
      </button>
    </div>
  );
}
