import type { Slots } from './types';

/** Id dnd-kit: viên trong khay `tray:<id>`, ô trong hộp `cell:<index>`, vùng khay `tray`. */
export const TRAY_ZONE_ID = 'tray';
export const trayItemId = (chocolateId: string) => `tray:${chocolateId}`;
export const cellDndId = (index: number) => `cell:${index}`;

export type DragSource = { type: 'tray'; chocolateId: string } | { type: 'cell'; index: number };
export type DropTarget = { type: 'cell'; index: number } | { type: 'tray' } | null;

export function parseSource(id: string | number | null | undefined): DragSource | null {
  if (typeof id !== 'string') return null;
  if (id.startsWith('tray:') && id.length > 5) return { type: 'tray', chocolateId: id.slice(5) };
  if (id.startsWith('cell:')) {
    const index = Number(id.slice(5));
    if (Number.isInteger(index) && index >= 0) return { type: 'cell', index };
  }
  return null;
}

export function parseTarget(id: string | number | null | undefined): DropTarget {
  if (id === TRAY_ZONE_ID) return { type: 'tray' };
  const s = parseSource(id);
  return s?.type === 'cell' ? s : null;
}

/** Kết quả thả: UI áp dụng vào store và đọc thành thông báo. */
export type DropAction =
  | { kind: 'none' }
  | { kind: 'place'; index: number; id: string; replaced: string | null }
  | { kind: 'swap'; from: number; to: number; moved: string; displaced: string | null }
  | { kind: 'remove'; index: number; id: string };

const NONE: DropAction = { kind: 'none' };

/**
 * Ánh xạ "kéo gì, thả đâu" thành hành động (hàm thuần, dễ test):
 * - khay → ô trống: đặt; khay → ô có viên: thay (viên cũ bị bỏ);
 * - ô → ô khác: đổi chỗ (ô đích trống thì là chuyển);
 * - ô → khay hoặc ra ngoài (over = null): bỏ viên;
 * - khay → ngoài / ô → chính nó: không làm gì.
 */
export function resolveDrop(
  activeId: string | number | null | undefined,
  overId: string | number | null | undefined,
  slots: Slots,
  isAvailable: (chocolateId: string) => boolean = () => true,
): DropAction {
  const source = parseSource(activeId);
  if (!source) return NONE;
  const target = parseTarget(overId ?? null);
  const inRange = (i: number) => i >= 0 && i < slots.length;

  if (source.type === 'tray') {
    if (target?.type !== 'cell' || !inRange(target.index)) return NONE;
    if (!isAvailable(source.chocolateId)) return NONE;
    const replaced = slots[target.index] ?? null;
    if (replaced === source.chocolateId) return NONE;
    return { kind: 'place', index: target.index, id: source.chocolateId, replaced };
  }

  const moved = inRange(source.index) ? (slots[source.index] ?? null) : null;
  if (moved === null) return NONE;
  if (target?.type === 'cell') {
    if (target.index === source.index || !inRange(target.index)) return NONE;
    return {
      kind: 'swap',
      from: source.index,
      to: target.index,
      moved,
      displaced: slots[target.index] ?? null,
    };
  }
  return { kind: 'remove', index: source.index, id: moved };
}
