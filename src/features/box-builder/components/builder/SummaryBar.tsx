'use client';

import { useId, useState } from 'react';
import { Button } from '@/components/ui';
import { builder as t } from '@/content/builder';
import { formatVnd } from '@/lib/utils/formatVnd';
import type { Pricing } from '../../model/box-logic';

/**
 * Tóm tắt giá. Dưới 64rem gọn một dòng ("5/12 viên · 395.000 ₫" + "Chi tiết" mở bảng giá) và một
 * hàng nút nhãn ngắn; từ 64rem hiện đủ như một khung bên cạnh hộp (xem builder.css).
 * Nhãn đầy đủ nằm ở aria-label / phần chỉ-đọc-màn-hình, nhãn ngắn chỉ để nhìn.
 */
export function SummaryBar({
  pricing,
  onFillRandom,
  onClear,
}: {
  pricing: Pricing;
  onFillRandom: () => void;
  onClear: () => void;
}) {
  const { filled, capacity, boxPrice, piecesPrice, total, isFull, isEmpty } = pricing;
  const [open, setOpen] = useState(false);
  const detailId = useId();
  return (
    <div className="bb-summary" role="group" aria-label={t.summaryLabel}>
      <div className="bb-summary-head">
        <p className="bb-progress tabular">
          <span className="bb-progress-long">{t.progress(filled, capacity)}</span>
          <span className="bb-progress-short" aria-hidden="true">
            {filled}/{capacity} viên
          </span>
        </p>
        <span className="bb-dot" aria-hidden="true">
          ·
        </span>
        <p className="bb-total tabular">{formatVnd(total)}</p>
        <button
          type="button"
          className="bb-toggle"
          aria-expanded={open}
          aria-controls={detailId}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? t.detailsHideLabel : t.detailsShow}
        </button>
      </div>
      <dl id={detailId} className="bb-breakdown tabular" data-open={open ? 'true' : 'false'}>
        <div>
          <dt>{t.priceBox}</dt>
          <dd>{formatVnd(boxPrice)}</dd>
        </div>
        <span aria-hidden="true">+</span>
        <div>
          <dt>{t.pricePieces}</dt>
          <dd>{formatVnd(piecesPrice)}</dd>
        </div>
        <span aria-hidden="true">=</span>
        <div>
          <dt>{t.priceTotal}</dt>
          <dd>{formatVnd(total)}</dd>
        </div>
      </dl>
      <div className="bb-actions">
        <Button
          variant="primary"
          onClick={onFillRandom}
          disabled={isFull || capacity === 0}
          aria-label={t.fillRandom}
        >
          <span className="bb-label-long" aria-hidden="true">
            {t.fillRandom}
          </span>
          <span className="bb-label-short" aria-hidden="true">
            {t.fillRandomShort}
          </span>
        </Button>
        <Button variant="ghost" onClick={onClear} disabled={isEmpty}>
          {t.clearAll}
        </Button>
      </div>
    </div>
  );
}
