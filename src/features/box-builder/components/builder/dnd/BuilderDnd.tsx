'use client';

import { useMemo, useState, type ReactNode } from 'react';
import {
  DndContext,
  DragOverlay,
  TouchSensor,
  pointerWithin,
  rectIntersection,
  useDndContext,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type CollisionDetection,
  type DragStartEvent,
} from '@dnd-kit/core';
import type { Modifier } from '@dnd-kit/core';
import { getEventCoordinates } from '@dnd-kit/utilities';
import { ChocolateImage } from '@/features/catalog/components/ChocolateImage';
import type { Chocolate } from '@/lib/schemas/chocolate';
import { builder as t } from '@/content/builder';
import { TRAY_ZONE_ID, parseSource, resolveDrop, type DropAction } from '../../../model/drop';
import type { Slots } from '../../../model/types';
import { markDragEnded } from './dragGuard';
import { GridKeyboardSensor, MousePenSensor, gridCoordinateGetter } from './sensors';

/** Ưu tiên ô dưới con trỏ; không có con trỏ (bàn phím) thì dùng phần giao của hình chữ nhật. */
const collisionDetection: CollisionDetection = (args) => {
  const hits = pointerWithin(args);
  const found = hits.length > 0 ? hits : rectIntersection(args);
  const cells = found.filter((c) => String(c.id).startsWith('cell:'));
  return cells.length > 0 ? cells : found;
};

/**
 * Tự cuộn khi kéo sát mép: vùng kích hoạt hẹp (12% chiều cao, không cuộn ngang) và gia tốc thấp,
 * để kéo gần mép dưới không làm trang trôi hoặc nhảy (F1).
 */
const AUTO_SCROLL = { threshold: { x: 0, y: 0.12 }, acceleration: 6 } as const;

/** Viên bám giữa con trỏ (khung overlay có kích thước phần tử nguồn). */
const centerOnPointer: Modifier = ({ activatorEvent, draggingNodeRect, transform }) => {
  if (!draggingNodeRect || !activatorEvent) return transform;
  const start = getEventCoordinates(activatorEvent);
  if (!start) return transform;
  return {
    ...transform,
    x: transform.x + start.x - draggingNodeRect.left - draggingNodeRect.width / 2,
    y: transform.y + start.y - draggingNodeRect.top - draggingNodeRect.height / 2,
  };
};

type Props = {
  slots: Slots;
  byId: ReadonlyMap<string, Chocolate>;
  onDrop: (action: DropAction) => void;
  children: ReactNode;
};

/**
 * Bối cảnh kéo-thả của builder: chuột/bút kéo sau 6px, chạm tay giữ 250ms (để vuốt vẫn cuộn
 * trang), bàn phím theo lưới. Thông báo cho trình đọc màn hình bằng tiếng Việt; kết quả thả do
 * Builder thông báo qua vùng aria-live của nó (nên onDragEnd ở đây im lặng).
 */
export function BuilderDnd({ slots, byId, onDrop, children }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(MousePenSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(GridKeyboardSensor, { coordinateGetter: gridCoordinateGetter }),
  );

  const nameOf = useMemo(
    () => (id: string | number | null | undefined) => {
      const s = parseSource(id);
      if (!s) return '';
      const cid = s.type === 'tray' ? s.chocolateId : slots[s.index];
      return cid ? (byId.get(cid)?.name ?? cid) : '';
    },
    [slots, byId],
  );

  const announcements: Announcements = useMemo(
    () => ({
      onDragStart: ({ active }) => t.dndStart(nameOf(active.id)),
      onDragOver: ({ active, over }) => {
        const target = over ? parseSource(over.id) : null;
        if (target?.type === 'cell') {
          const source = parseSource(active.id);
          if (source?.type === 'cell' && source.index === target.index)
            return t.dndOverSelf(target.index + 1);
          const occupant = slots[target.index];
          return occupant
            ? t.dndOverFilled(target.index + 1, byId.get(occupant)?.name ?? occupant)
            : t.dndOverEmpty(target.index + 1);
        }
        return parseSource(active.id)?.type === 'cell' ? t.dndOutsideRemove : t.dndOutside;
      },
      onDragEnd: () => undefined,
      onDragCancel: ({ active }) => t.dndCancel(nameOf(active.id)),
    }),
    [nameOf, slots, byId],
  );

  const activeChoc = (() => {
    const s = parseSource(activeId);
    if (!s) return null;
    const cid = s.type === 'tray' ? s.chocolateId : slots[s.index];
    return cid ? (byId.get(cid) ?? null) : null;
  })();

  return (
    <DndContext
      id="builder-dnd"
      sensors={sensors}
      autoScroll={AUTO_SCROLL}
      collisionDetection={collisionDetection}
      accessibility={{
        announcements,
        screenReaderInstructions: { draggable: t.dndInstructions },
      }}
      onDragStart={(e: DragStartEvent) => setActiveId(String(e.active.id))}
      onDragEnd={({ active, over }) => {
        setActiveId(null);
        markDragEnded();
        onDrop(
          resolveDrop(active.id, over?.id ?? null, slots, (id) => byId.get(id)?.available ?? false),
        );
      }}
      onDragCancel={() => {
        setActiveId(null);
        markDragEnded();
      }}
    >
      {children}
      <DragOverlay dropAnimation={null} modifiers={[centerOnPointer]} zIndex={60}>
        {activeChoc ? (
          <div className="bb-overlay">
            <ChocolateImage
              src={activeChoc.image}
              alt=""
              width={96}
              height={96}
              loading="eager"
              className="bb-overlay-img"
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

/** Vùng khay chọn viên: thả viên từ hộp vào đây để bỏ. */
export function TrayDropZone({ className, children }: { className?: string; children: ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: TRAY_ZONE_ID });
  const { active } = useDndContext();
  const armed = parseSource(active?.id)?.type === 'cell';
  return (
    <div
      ref={setNodeRef}
      className={className}
      data-armed={armed ? 'true' : undefined}
      data-over={armed && isOver ? 'true' : undefined}
    >
      {children}
    </div>
  );
}
