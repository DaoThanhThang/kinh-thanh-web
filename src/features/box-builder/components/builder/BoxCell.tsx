'use client';

import { useDndContext, useDraggable, useDroppable } from '@dnd-kit/core';
import { ChocolateImage } from '@/features/catalog/components/ChocolateImage';
import type { Chocolate } from '@/lib/schemas/chocolate';
import { builder as t } from '@/content/builder';
import { cellDndId } from '../../model/drop';
import { justDragged } from './dnd/dragGuard';

type Props = {
  index: number;
  /** Id viên trong ô (null = trống). */
  id: string | null;
  choc: Chocolate | undefined;
  selected: boolean;
  /** Viên đang cầm (chạm-để-đặt): ô trống thành đích. */
  held: Chocolate | null;
  fresh: boolean;
  menuOpen: boolean;
  menuId: string;
  onEmptyClick: () => void;
  onFilledClick: () => void;
};

/** Một ô: nút bấm, đích thả (mọi ô) và nguồn kéo (ô có viên). */
export function BoxCell({
  index,
  id,
  choc,
  selected,
  held,
  fresh,
  menuOpen,
  menuId,
  onEmptyClick,
  onFilledClick,
}: Props) {
  const dndId = cellDndId(index);
  const filled = id !== null;
  const drag = useDraggable({
    id: dndId,
    disabled: !filled,
    attributes: { roleDescription: t.dndRoleDescription },
  });
  const drop = useDroppable({ id: dndId });
  const { active } = useDndContext();
  const over = drop.isOver && active !== null && active.id !== dndId;
  const n = index + 1;

  const setRef = (el: HTMLButtonElement | null) => {
    drag.setNodeRef(el);
    drop.setNodeRef(el);
  };

  if (!filled) {
    return (
      <button
        ref={setRef}
        type="button"
        className="bb-cell-btn"
        data-filled="false"
        data-targeting={held ? 'true' : undefined}
        data-over={over ? 'true' : undefined}
        aria-pressed={held ? undefined : selected}
        aria-label={
          held ? t.cellTarget(n, held.name) : selected ? t.cellEmptySelected(n) : t.cellEmpty(n)
        }
        onClick={() => {
          if (justDragged()) return;
          onEmptyClick();
        }}
      >
        <span className="bb-engrave" aria-hidden="true" />
      </button>
    );
  }

  const name = choc?.name ?? id;
  return (
    <button
      ref={setRef}
      type="button"
      {...drag.attributes}
      {...drag.listeners}
      className="bb-cell-btn"
      data-filled="true"
      data-dragging={drag.isDragging ? 'true' : undefined}
      data-over={over ? 'true' : undefined}
      aria-haspopup="dialog"
      aria-expanded={menuOpen}
      aria-controls={menuOpen ? menuId : undefined}
      aria-label={t.cellFilled(n, name)}
      onClick={() => {
        if (justDragged()) return;
        onFilledClick();
      }}
    >
      <span className={fresh ? 'bb-piece bb-piece-drop' : 'bb-piece'}>
        <ChocolateImage
          src={choc?.image ?? '/chocolates/fallback.svg'}
          alt=""
          width={96}
          height={96}
          loading="eager"
        />
      </span>
    </button>
  );
}
