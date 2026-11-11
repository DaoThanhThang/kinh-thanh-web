'use client';

import type { BoxOption } from '@/lib/schemas/box';
import { formatVnd } from '@/lib/utils/formatVnd';
import { builder as t } from '@/content/builder';

/**
 * Nhóm radio gốc (bàn phím: mũi tên đổi lựa chọn, Tab vào/ra nhóm). Input ẩn thị giác nhưng
 * vẫn là phần tử thật; nhãn là vùng chạm ≥ 44px.
 */
export function SizeSelector({
  boxes,
  value,
  onSelect,
}: {
  boxes: readonly BoxOption[];
  value: number | null;
  onSelect: (size: number) => void;
}) {
  return (
    <fieldset className="bb-sizes">
      <legend className="sr-only">{t.sizeLegend}</legend>
      {boxes.map((b) => (
        <label key={b.size} className="bb-size">
          <input
            type="radio"
            name="box-size"
            value={b.size}
            checked={value === b.size}
            onChange={() => onSelect(b.size)}
            className="bb-size-input"
          />
          <span className="bb-size-face">
            <span className="bb-size-name">{t.sizeLabel(b.size)}</span>
            <span className="bb-size-price tabular">{formatVnd(b.price)}</span>
          </span>
        </label>
      ))}
    </fieldset>
  );
}
