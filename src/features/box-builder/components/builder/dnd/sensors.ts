import {
  type DraggableNode,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  type KeyboardCoordinateGetter,
  type KeyboardSensorOptions,
  type PointerSensorOptions,
} from '@dnd-kit/core';
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from 'react';

/**
 * Chạm tay: dnd-kit mặc định gắn một listener `touchmove` KHÔNG passive lên window ngay khi mount
 * (để preventDefault hoạt động trên iOS), khiến mọi lần vuốt cuộn trên trang phải chờ luồng chính.
 * Ở đây chỉ gắn nó khi ngón tay chạm vào một phần tử kéo được (`[aria-roledescription]`, do
 * dnd-kit đặt) và gỡ khi nhả; vuốt cuộn ở chỗ khác không bị chặn (R1).
 */
export class LazyTouchSensor extends TouchSensor {
  static override setup() {
    const noop = () => {};
    let armed = false;
    const arm = () => {
      if (armed) return;
      armed = true;
      window.addEventListener('touchmove', noop, { capture: false, passive: false });
    };
    const disarm = () => {
      if (!armed) return;
      armed = false;
      window.removeEventListener('touchmove', noop);
    };
    const onStart = (event: TouchEvent) => {
      const target = event.target;
      if (target instanceof Element && target.closest('[aria-roledescription]')) arm();
    };
    // Passive + capture: chạy trước handler của React, không chặn cuộn.
    window.addEventListener('touchstart', onStart, { capture: true, passive: true });
    window.addEventListener('touchend', disarm, { capture: true, passive: true });
    window.addEventListener('touchcancel', disarm, { capture: true, passive: true });
    return () => {
      window.removeEventListener('touchstart', onStart, { capture: true });
      window.removeEventListener('touchend', disarm, { capture: true });
      window.removeEventListener('touchcancel', disarm, { capture: true });
      disarm();
    };
  }
}

/** Chuột / bút: kéo sau 6px để bấm thường vẫn là bấm. Chạm tay do TouchSensor (giữ 250ms) lo. */
export class MousePenSensor extends PointerSensor {
  static override activators = [
    {
      eventName: 'onPointerDown' as const,
      handler: (
        { nativeEvent: event }: ReactPointerEvent,
        { onActivation }: PointerSensorOptions,
      ) => {
        if (!event.isPrimary || event.button !== 0 || event.pointerType === 'touch') return false;
        onActivation?.({ event });
        return true;
      },
    },
  ];
}

/**
 * Bàn phím: Space nhấc/thả ở mọi nơi; Enter nhấc ở viên trong khay. Trên ô đã có viên, Enter
 * vẫn mở menu tuỳ chọn (không bị nuốt) nên chỉ Space để nhấc.
 */
export class GridKeyboardSensor extends KeyboardSensor {
  static override activators = [
    {
      eventName: 'onKeyDown' as const,
      handler: (
        event: ReactKeyboardEvent,
        { onActivation }: KeyboardSensorOptions,
        { active }: { active: DraggableNode },
      ) => {
        const { code } = event.nativeEvent;
        if (code !== 'Space' && code !== 'Enter') return false;
        const activator = active.activatorNode.current;
        if (activator && event.target !== activator) return false;
        const data = active.data.current as { type?: string } | undefined;
        if (code === 'Enter' && data?.type === 'cell') return false;
        event.preventDefault();
        onActivation?.({ event: event.nativeEvent });
        return true;
      },
    },
  ];
}

const ARROWS: Record<string, readonly [number, number]> = {
  ArrowRight: [1, 0],
  ArrowLeft: [-1, 0],
  ArrowDown: [0, 1],
  ArrowUp: [0, -1],
};

/**
 * Mũi tên chuyển giữa các ô theo lưới: chọn ô gần nhất theo hướng bấm (ưu tiên cùng hàng/cột).
 * Chưa đứng trong ô nào (vừa nhấc từ khay) thì nhảy tới ô gần nhất.
 */
export const gridCoordinateGetter: KeyboardCoordinateGetter = (
  event,
  { context: { collisionRect, droppableRects, droppableContainers }, currentCoordinates },
) => {
  const dir = ARROWS[event.code];
  if (!dir) return undefined;
  event.preventDefault();
  if (!collisionRect) return undefined;

  const cx = collisionRect.left + collisionRect.width / 2;
  const cy = collisionRect.top + collisionRect.height / 2;
  const cells = droppableContainers
    .getEnabled()
    .filter((c) => String(c.id).startsWith('cell:'))
    .flatMap((c) => {
      const r = droppableRects.get(c.id);
      return r ? [{ x: r.left + r.width / 2, y: r.top + r.height / 2, r }] : [];
    });
  if (cells.length === 0) return undefined;

  const inside = cells.find(
    ({ r }) => cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom,
  );
  let best: { x: number; y: number } | undefined;
  if (!inside) {
    let min = Infinity;
    for (const c of cells) {
      const d = Math.hypot(c.x - cx, c.y - cy);
      if (d < min) {
        min = d;
        best = c;
      }
    }
  } else {
    const step = Math.min(inside.r.width, inside.r.height) * 0.5;
    let min = Infinity;
    for (const c of cells) {
      const dx = (c.x - inside.x) * dir[0];
      const dy = (c.y - inside.y) * dir[1];
      const along = dx + dy;
      if (along < step) continue;
      const across = Math.abs((c.x - inside.x) * dir[1]) + Math.abs((c.y - inside.y) * dir[0]);
      const score = along + across * 3;
      if (score < min) {
        min = score;
        best = c;
      }
    }
  }
  if (!best) return undefined;
  return { x: currentCoordinates.x + (best.x - cx), y: currentCoordinates.y + (best.y - cy) };
};
