'use client';

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { Chocolate } from '@/lib/schemas/chocolate';
import { formatVnd } from '@/lib/utils/formatVnd';
import { builder as t } from '@/content/builder';
import { GiftBox, Ribbon, type RibbonState } from '../box';
import { BoxCell } from './BoxCell';
import { LidEdge } from './LidEdge';
import type { Slots } from '../../model/types';

type Props = {
  cols: number;
  rows: number;
  slots: Slots;
  byId: ReadonlyMap<string, Chocolate>;
  /** Ô trống đang chọn. */
  selected: number | null;
  onSelect: (index: number | null) => void;
  /** Viên đang cầm (chạm-để-đặt). */
  held: Chocolate | null;
  /** Đặt viên đang cầm vào ô trống. */
  onPlaceHeld: (index: number) => void;
  /** Thay viên trong ô bằng viên đang cầm (từ menu ô). */
  onReplaceHeld: (index: number) => void;
  /** Các ô vừa nhận viên: chạy hiệu ứng rơi. */
  fresh: ReadonlySet<number>;
  onRemove: (index: number) => void;
  /** Hộp đóng (bước hoàn tất): nắp phủ khay, các ô không thao tác được. */
  closed?: boolean;
  /** Khoá thao tác trên ô (đóng, đang đóng/mở). Mặc định theo `closed`. */
  locked?: boolean;
  /** Ruy băng trên nắp (null = chưa thắt). */
  ribbon?: RibbonState | null;
  /** Bỏ chuyển tiếp nắp (hộp đã đầy / đã có viên từ trước khi tải trang). */
  instant?: boolean;
  /** Nắp đang mở lần đầu (mở khi tới nơi): chuyển tiếp dài hơn một chút. */
  opening?: boolean;
};

type MenuPos = { left: number; top: number; above: boolean };

/**
 * Hộp mở với khay `cols × rows`. Mỗi ô là một nút: ô trống = đích chọn; ô có viên mở menu nhỏ
 * ("Bỏ viên này"). Menu nằm ngoài hộp 3D để không bị méo, định vị theo ô.
 */
export function BoxStage({
  cols,
  rows,
  slots,
  byId,
  selected,
  onSelect,
  held,
  onPlaceHeld,
  onReplaceHeld,
  fresh,
  onRemove,
  closed = false,
  locked = closed,
  ribbon = null,
  instant = false,
  opening = false,
}: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menu, setMenu] = useState<number | null>(null);
  const [pos, setPos] = useState<MenuPos | null>(null);
  const menuId = useId();

  // Ô của menu không còn viên (đã bỏ / đổi size) → đóng menu.
  const menuOpen = menu !== null && slots[menu] != null;
  const openIndex = menuOpen ? menu : null;

  const cellButton = useCallback(
    (index: number) =>
      stageRef.current?.querySelector<HTMLButtonElement>(`[data-slot="${index}"] .bb-cell-btn`) ??
      null,
    [],
  );

  const closeMenu = useCallback(
    (restoreFocus: boolean) => {
      const index = menu;
      setMenu(null);
      setPos(null);
      if (restoreFocus && index !== null) cellButton(index)?.focus();
    },
    [menu, cellButton],
  );

  // Định vị menu theo ô (đo sau khi bố cục xong; đo lại khi đổi cỡ cửa sổ).
  useLayoutEffect(() => {
    if (openIndex === null) return;
    const place = () => {
      const stage = stageRef.current;
      const btn = cellButton(openIndex);
      if (!stage || !btn) return;
      const s = stage.getBoundingClientRect();
      const c = btn.getBoundingClientRect();
      const menuW = menuRef.current?.offsetWidth ?? 200;
      const cx = c.left + c.width / 2 - s.left;
      const left = Math.min(Math.max(cx - menuW / 2, 0), Math.max(0, s.width - menuW));
      const above = c.top + c.height / 2 > s.top + s.height * 0.55;
      setPos({
        left,
        top: above ? c.top - s.top - 8 : c.bottom - s.top + 8,
        above,
      });
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [openIndex, cellButton, cols, rows]);

  // Mở menu: chuyển focus vào nút chính. Bấm ra ngoài hoặc Esc: đóng.
  useEffect(() => {
    if (openIndex === null) return;
    menuRef.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node;
      if (menuRef.current?.contains(target)) return;
      if ((target as Element).closest?.('.bb-cell-btn[data-filled="true"]')) return;
      setMenu(null);
      setPos(null);
    };
    document.addEventListener('pointerdown', onPointer);
    return () => document.removeEventListener('pointerdown', onPointer);
  }, [openIndex]);

  const renderCell = (index: number) => {
    const id = slots[index] ?? null;
    return (
      <BoxCell
        index={index}
        id={id}
        choc={id !== null ? byId.get(id) : undefined}
        selected={selected === index}
        held={held}
        fresh={fresh.has(index)}
        menuOpen={openIndex === index}
        menuId={menuId}
        onEmptyClick={() =>
          held ? onPlaceHeld(index) : onSelect(selected === index ? null : index)
        }
        onFilledClick={() => (openIndex === index ? closeMenu(false) : setMenu(index))}
      />
    );
  };

  const menuChoc = openIndex !== null ? byId.get(slots[openIndex] ?? '') : undefined;

  return (
    <div
      ref={stageRef}
      className="bb-stage"
      data-closed={closed ? 'true' : undefined}
      data-instant={instant ? 'true' : undefined}
      data-arrival={opening ? 'opening' : undefined}
      inert={locked}
    >
      <GiftBox
        cols={cols}
        rows={rows}
        open={closed ? 0 : 1}
        lidOverlay={ribbon ? <Ribbon cols={cols} rows={rows} state={ribbon} /> : undefined}
        renderCell={renderCell}
        lidInner={<LidEdge />}
        className="bb-box"
      />
      {openIndex !== null ? (
        <div
          ref={menuRef}
          id={menuId}
          role="dialog"
          aria-label={t.cellMenuLabel(openIndex + 1)}
          className="bb-menu"
          data-above={pos?.above ? 'true' : undefined}
          style={
            pos
              ? { left: pos.left, top: pos.top }
              : { left: 0, top: 0, visibility: 'hidden' as const }
          }
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.stopPropagation();
              closeMenu(true);
            }
          }}
        >
          <p className="bb-menu-name">{menuChoc?.name ?? slots[openIndex]}</p>
          {menuChoc ? <p className="bb-menu-price tabular">{formatVnd(menuChoc.price)}</p> : null}
          {held && held.id !== slots[openIndex] ? (
            <button
              type="button"
              className="bb-menu-btn bb-menu-btn-primary"
              data-autofocus
              onClick={() => {
                const index = openIndex;
                closeMenu(false);
                onReplaceHeld(index);
                requestAnimationFrame(() => cellButton(index)?.focus());
              }}
            >
              {t.cellReplaceWith(held.name)}
            </button>
          ) : null}
          <button
            type="button"
            className="bb-menu-btn"
            data-autofocus={held && held.id !== slots[openIndex] ? undefined : true}
            onClick={() => {
              const index = openIndex;
              closeMenu(false);
              onRemove(index);
              // Ô vừa trống: trả focus về chính ô đó.
              requestAnimationFrame(() => cellButton(index)?.focus());
            }}
          >
            {t.removePiece}
          </button>
        </div>
      ) : null}
    </div>
  );
}
