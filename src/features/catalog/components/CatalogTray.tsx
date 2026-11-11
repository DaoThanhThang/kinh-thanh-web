'use client';

import { useDraggable } from '@dnd-kit/core';
import { Heading, Text } from '@/components/ui';
import type { Chocolate } from '@/lib/schemas/chocolate';
import { formatVnd } from '@/lib/utils/formatVnd';
import { builder as t } from '@/content/builder';
import { ChocolateImage } from './ChocolateImage';

type Props = {
  chocolates: readonly Chocolate[];
  /** Số viên mỗi loại đang có trong hộp. */
  counts: Readonly<Record<string, number>>;
  /** Hộp đã đầy (hoặc chưa có chỗ): vô hiệu hoá "Thêm". */
  full: boolean;
  /** Id viên đang cầm (chạm-để-đặt). */
  heldId: string | null;
  /** Ô trống đang chọn (số thứ tự từ 0): thẻ đổi thành "Đặt vào ô N". */
  selectedCell: number | null;
  /** Id dnd-kit của thẻ (nguồn kéo). */
  dragId: (chocolateId: string) => string;
  /** "Thêm": đặt vào ô trống đầu tiên. */
  onAdd: (chocolate: Chocolate) => void;
  /** Bấm thẻ: cầm / thả viên (hoặc đặt vào ô đã chọn). */
  onPick: (chocolate: Chocolate) => void;
  /** Đặt vào ô trống đang chọn. */
  onPlaceInCell: (chocolate: Chocolate) => void;
  onDetails: (chocolate: Chocolate) => void;
  /** Bỏ qua click vừa sinh ra sau một lần kéo. */
  ignoreClick?: () => boolean;
};

function TrayCard({
  c,
  count,
  full,
  held,
  selectedCell,
  dragId,
  onAdd,
  onPick,
  onPlaceInCell,
  onDetails,
  ignoreClick,
}: Omit<Props, 'chocolates' | 'counts' | 'heldId'> & {
  c: Chocolate;
  count: number;
  held: boolean;
}) {
  const soldOut = !c.available;
  const drag = useDraggable({
    id: dragId(c.id),
    disabled: soldOut,
    attributes: { roleDescription: t.dndRoleDescription },
  });
  const cellN = selectedCell !== null ? selectedCell + 1 : null;
  const addLabel = cellN !== null ? t.trayPlaceIntoLabel(c.name, cellN) : t.trayAddLabel(c.name);
  const pickLabel = held
    ? t.trayHoldingLabel(c.name)
    : cellN !== null
      ? t.trayPickPlaceLabel(c.name, cellN)
      : t.trayHoldLabel(c.name);

  return (
    <li
      className="bt-item"
      data-unavailable={soldOut ? 'true' : undefined}
      data-held={held ? 'true' : undefined}
      data-dragging={drag.isDragging ? 'true' : undefined}
    >
      <button
        ref={soldOut ? undefined : drag.setNodeRef}
        type="button"
        className="bt-hold"
        disabled={soldOut}
        {...(soldOut ? {} : drag.attributes)}
        {...(soldOut ? {} : drag.listeners)}
        aria-pressed={cellN !== null ? undefined : held}
        aria-hidden={soldOut ? true : undefined}
        tabIndex={soldOut ? -1 : undefined}
        aria-label={soldOut ? undefined : pickLabel}
        onClick={() => {
          if (ignoreClick?.()) return;
          if (cellN !== null) onPlaceInCell(c);
          else onPick(c);
        }}
      >
        <span className="bt-media">
          <ChocolateImage src={c.image} alt="" width={160} height={160} />
          {count > 0 ? (
            <span className="bt-badge tabular" aria-label={t.trayCountLabel(count)}>
              {t.trayCount(count)}
            </span>
          ) : null}
        </span>
      </button>
      <button
        type="button"
        className="bt-name"
        onClick={() => onDetails(c)}
        aria-label={t.trayInfo(c.name)}
      >
        {c.name}
      </button>
      <p className="bt-price tabular">{formatVnd(c.price)}</p>
      <button
        type="button"
        className="bt-add"
        disabled={soldOut || (full && cellN === null)}
        aria-label={soldOut ? `${c.name}, ${t.trayUnavailable}` : addLabel}
        aria-describedby={full && !soldOut ? 'tray-hint' : undefined}
        onClick={() => (cellN !== null ? onPlaceInCell(c) : onAdd(c))}
      >
        {soldOut ? t.trayUnavailable : cellN !== null ? t.trayPlaceInto(cellN) : t.trayAdd}
      </button>
    </li>
  );
}

/** Khay chọn viên: thẻ là nguồn kéo-thả; chạm thẻ để cầm viên; "Thêm" đặt vào ô trống đầu tiên. */
export function CatalogTray({ chocolates, counts, full, heldId, ...rest }: Props) {
  return (
    <section className="bt" aria-labelledby="tray-heading">
      <div className="bt-head">
        <Heading as="h3" id="tray-heading">
          {t.trayHeading}
        </Heading>
        <Text role="small" tone="muted" id="tray-hint">
          {full ? t.trayFull : t.trayHint}
        </Text>
        <p className="bt-drop-hint" aria-hidden="true">
          {t.trayDropHint}
        </p>
      </div>
      <ul className="bt-grid">
        {chocolates.map((c) => (
          <TrayCard
            key={c.id}
            c={c}
            count={counts[c.id] ?? 0}
            full={full}
            held={heldId === c.id}
            {...rest}
          />
        ))}
      </ul>
    </section>
  );
}
