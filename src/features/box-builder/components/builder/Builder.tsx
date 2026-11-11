'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Container, Heading, Text } from '@/components/ui';
import { CatalogTray } from '@/features/catalog/components/CatalogTray';
import { ChocolateDetails } from '@/features/catalog/components/ChocolateDetails';
import type { BoxOption } from '@/lib/schemas/box';
import type { Chocolate } from '@/lib/schemas/chocolate';
import { prefersReducedMotion } from '@/lib/utils/motion';
import { builder as t } from '@/content/builder';
import { complete as tc } from '@/content/complete';
import { countById, previewResize } from '../../model/box-logic';
import type { Slots } from '../../model/types';
import { trayItemId, type DropAction } from '../../model/drop';
import { hydrateBoxStore, selectIsFull, useBoxStore, usePricing } from '../../store/useBoxStore';
import { useSelectionStore } from '../../store/useSelectionStore';
import { CompletePanel } from '../complete/CompletePanel';
import { useCompletion } from '../complete/useCompletion';
import { BoxStage } from './BoxStage';
import { ConfirmDialog } from './ConfirmDialog';
import { BuilderDnd, TrayDropZone } from './dnd/BuilderDnd';
import { justDragged } from './dnd/dragGuard';
import { HoldBar } from './HoldBar';
import { SizeSelector } from './SizeSelector';
import { SummaryBar } from './SummaryBar';
import './builder.css';

/** Cỡ hộp mặc định khi chưa chọn (D12: 4×3). */
const DEFAULT_SIZE = 12;
const NO_FRESH: ReadonlySet<number> = new Set();

type Pending = { kind: 'resize'; size: number; dropped: number } | { kind: 'clear' } | null;

/** Các ô vừa nhận viên (chỉ khi cùng cỡ hộp), để chạy hiệu ứng rơi. */
function newlyFilled(prev: Slots, next: Slots): ReadonlySet<number> {
  if (prev.length !== next.length) return NO_FRESH;
  const out = new Set<number>();
  next.forEach((id, i) => {
    if (id !== null && prev[i] !== id) out.add(i);
  });
  return out;
}

/**
 * Phần xếp hộp: chọn cỡ, hộp mở với lưới ô, khay chọn viên, tóm tắt giá. Catalog được truyền từ
 * server; trạng thái hộp nằm trong store (hydrate ở client sau khi mount, xem D20).
 */
export function Builder({
  chocolates,
  boxes,
}: {
  chocolates: readonly Chocolate[];
  boxes: readonly BoxOption[];
}) {
  const size = useBoxStore((s) => s.size);
  const slots = useBoxStore((s) => s.slots);
  const selectSize = useBoxStore((s) => s.selectSize);
  const removeAt = useBoxStore((s) => s.removeAt);
  const clearAll = useBoxStore((s) => s.clearAll);
  const fillRandom = useBoxStore((s) => s.fillRandom);
  const sanitizeWith = useBoxStore((s) => s.sanitizeWith);

  const defaultBox = boxes.find((b) => b.size === DEFAULT_SIZE) ?? boxes[0];
  const box = boxes.find((b) => b.size === size) ?? defaultBox;
  const capacity = box?.size ?? 0;
  const full = useBoxStore(selectIsFull(capacity));
  const pricing = usePricing(chocolates, boxes);
  const byId = useMemo(() => new Map(chocolates.map((c) => [c.id, c])), [chocolates]);
  const counts = useMemo(() => countById(slots), [slots]);

  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState<Pending>(null);
  const [detail, setDetail] = useState<Chocolate | null>(null);
  const [message, setMessage] = useState({ text: '', n: 0 });
  const sizesRef = useRef<HTMLDivElement>(null);
  const boxAreaRef = useRef<HTMLDivElement>(null);
  const [boxVisible, setBoxVisible] = useState(true);
  const panelRef = useRef<HTMLDivElement>(null);

  const heldId = useSelectionStore((s) => s.held);
  const placedCount = useSelectionStore((s) => s.placed);
  const selected = useSelectionStore((s) => s.cell);
  const toggleHold = useSelectionStore((s) => s.toggleHold);
  const release = useSelectionStore((s) => s.release);
  const notePlaced = useSelectionStore((s) => s.notePlaced);
  const toggleCell = useSelectionStore((s) => s.toggleCell);
  const clearCell = useSelectionStore((s) => s.clearCell);
  const heldChoc = heldId ? byId.get(heldId) : undefined;
  const held = heldChoc?.available ? heldChoc : null;

  const announce = useCallback((text: string) => setMessage((m) => ({ text, n: m.n + 1 })), []);

  // Bước hoàn tất (T11): hộp đầy → đóng nắp → ruy băng → thiệp; bỏ viên → về chế độ sửa.
  const { phase, instant, reopen } = useCompletion(full, ready);
  const editing = phase === 'edit';
  const lidClosed = phase === 'closing' || phase === 'tying' || phase === 'ready';
  const ribbon =
    phase === 'tying'
      ? 'tying'
      : phase === 'ready'
        ? 'tied'
        : phase === 'opening'
          ? 'untying'
          : null;

  // Thông báo cho trình đọc màn hình khi đổi pha (điều chỉnh state ngay lúc render).
  const [announcedPhase, setAnnouncedPhase] = useState(phase);
  if (announcedPhase !== phase) {
    setAnnouncedPhase(phase);
    const text =
      phase === 'closing'
        ? tc.announceClosing
        : phase === 'ready' && announcedPhase === 'tying'
          ? tc.announceReady
          : phase === 'edit' && announcedPhase === 'opening'
            ? tc.announceReopened
            : null;
    if (text) announce(text);
  }

  const prevPhase = useRef(phase);
  useEffect(() => {
    const prev = prevPhase.current;
    prevPhase.current = phase;
    if (prev === phase) return;
    const reduce = prefersReducedMotion();
    const behavior = reduce ? 'auto' : 'smooth';
    if (phase === 'closing') {
      // Hộp có thể nằm ngoài màn hình (thêm viên từ khay phía dưới trên mobile): đưa vào tầm nhìn.
      requestAnimationFrame(() => {
        const r = boxAreaRef.current?.getBoundingClientRect();
        if (r && (r.top < 0 || r.bottom > window.innerHeight))
          boxAreaRef.current?.scrollIntoView({ block: 'center', behavior });
      });
    } else if (phase === 'ready' && prev === 'tying') {
      const r = panelRef.current?.getBoundingClientRect();
      if (r && r.top > window.innerHeight * 0.7)
        window.scrollBy({ top: r.top - window.innerHeight * 0.25, behavior });
    } else if (phase === 'edit' && prev === 'opening') {
      boxAreaRef.current?.querySelector<HTMLElement>('.bb-cell-btn')?.focus();
    }
  }, [phase]);

  // Hiệu ứng rơi: so ô cũ với ô mới ngay lúc render (chỉ sau khi đã hydrate).
  const [prevSlots, setPrevSlots] = useState(slots);
  const [fresh, setFresh] = useState<ReadonlySet<number>>(NO_FRESH);
  if (prevSlots !== slots) {
    setPrevSlots(slots);
    setFresh(ready ? newlyFilled(prevSlots, slots) : NO_FRESH);
  }

  // Đọc localStorage, làm sạch theo catalog, mặc định cỡ 12.
  useEffect(() => {
    let cancelled = false;
    void hydrateBoxStore().then(() => {
      if (cancelled) return;
      const removed = sanitizeWith(chocolates, boxes);
      if (removed.length > 0) announce(t.announceRemovedOnLoad(removed.length));
      if (useBoxStore.getState().size === null && defaultBox) selectSize(defaultBox.size);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [chocolates, boxes, defaultBox, sanitizeWith, selectSize, announce]);

  // Ô chọn nằm ngoài hộp (đổi cỡ) hoặc đã có viên → bỏ chọn.
  const selectedValid = selected !== null && selected < slots.length && slots[selected] === null;
  const selectedCell = selectedValid ? selected : null;

  // Không để trạng thái chọn sót lại khi rời trang.
  useEffect(() => () => useSelectionStore.getState().reset(), []);

  // Hộp ra khỏi màn hình khi đang cầm viên → hiện nút "Xem hộp".
  useEffect(() => {
    const el = boxAreaRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      ([entry]) => entry && setBoxVisible(entry.isIntersecting && entry.intersectionRatio >= 0.2),
      { threshold: [0, 0.2, 0.5, 1] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ready]);

  const scrollToBox = () => {
    const reduce = prefersReducedMotion();
    boxAreaRef.current?.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
  };

  const requestSize = (next: number) => {
    if (next === size) return;
    const { dropped } = previewResize(slots, next);
    if (dropped.length > 0) setPending({ kind: 'resize', size: next, dropped: dropped.length });
    else {
      selectSize(next);
      announce(t.announceResized(next));
    }
  };

  const add = (c: Chocolate) => {
    const index = useBoxStore.getState().placeInFirstEmpty(c.id);
    if (index === null) {
      if (slots.length > 0) announce(t.announceFull);
    } else {
      const nowFull = !useBoxStore.getState().slots.includes(null);
      if (nowFull && useSelectionStore.getState().held) {
        release();
        announce(`${t.announcePlaced(c.name, index + 1)}. ${t.announceFullDone}`);
      } else announce(t.announcePlaced(c.name, index + 1));
    }
  };

  const nameOf = (id: string | null) => (id ? (byId.get(id)?.name ?? id) : '');

  /** Đặt/thay `c` vào ô `index`; trả về lời thông báo và việc hộp có vừa đầy lên không. */
  const putPiece = (index: number, c: Chocolate) => {
    const store = useBoxStore.getState();
    const prev = store.slots[index] ?? null;
    store.placeAt(index, c.id);
    const filledUp = prev === null && !useBoxStore.getState().slots.includes(null);
    const text =
      prev !== null
        ? t.announceReplaced(nameOf(prev), c.name, index + 1)
        : t.announcePlaced(c.name, index + 1);
    return { text, filledUp };
  };

  // Chạm-để-đặt: giữ viên đang cầm để đặt liên tiếp.
  const placeHeld = (index: number) => {
    if (!held) return;
    const { text, filledUp } = putPiece(index, held);
    notePlaced();
    if (filledUp) {
      release();
      announce(`${text}. ${t.announceFullDone}`);
    } else announce(text);
  };

  const pick = (c: Chocolate) => {
    const wasHeld = useSelectionStore.getState().held === c.id;
    toggleHold(c.id);
    announce(wasHeld ? t.announceReleased : t.announceHeld(c.name));
  };

  const placeInSelectedCell = (c: Chocolate) => {
    if (selectedCell === null) return;
    const { text } = putPiece(selectedCell, c);
    clearCell();
    announce(text);
  };

  const toggleSelectedCell = (index: number | null) => {
    toggleCell(index);
    if (index === null) return;
    announce(
      useSelectionStore.getState().cell === index
        ? t.announceCellSelected(index + 1)
        : t.announceCellDeselected(index + 1),
    );
  };

  const finishHold = () => {
    release();
    announce(t.announceReleased);
  };

  const applyDrop = (action: DropAction) => {
    const store = useBoxStore.getState();
    if (action.kind === 'place') {
      const c = byId.get(action.id);
      if (c) announce(putPiece(action.index, c).text);
    } else if (action.kind === 'swap') {
      store.swap(action.from, action.to);
      announce(
        action.displaced === null
          ? t.announceMoved(nameOf(action.moved), action.from + 1, action.to + 1)
          : t.announceSwapped(action.from + 1, action.to + 1),
      );
    } else if (action.kind === 'remove') {
      store.removeAt(action.index);
      announce(t.announceRemoved(nameOf(action.id), action.index + 1));
    }
  };

  const remove = (index: number) => {
    const id = slots[index];
    removeAt(index);
    if (id) announce(t.announceRemoved(byId.get(id)?.name ?? id, index + 1));
  };

  const doFillRandom = () => {
    const before = slots.filter((s) => s === null).length;
    fillRandom(chocolates);
    const after = useBoxStore.getState().slots.filter((s) => s === null).length;
    announce(t.announceFilledRandom(before - after));
  };

  const confirm = () => {
    const p = pending;
    setPending(null);
    if (p?.kind === 'resize') {
      selectSize(p.size);
      announce(t.announceResized(p.size));
    } else if (p?.kind === 'clear') {
      clearAll();
      announce(t.announceCleared);
    }
  };

  const cancel = () => {
    setPending(null);
    // Trả focus về lựa chọn đang có hiệu lực (nhóm radio vừa bị mũi tên đưa focus đi).
    requestAnimationFrame(() =>
      sizesRef.current?.querySelector<HTMLInputElement>('input:checked')?.focus(),
    );
  };

  const confirmProps =
    pending?.kind === 'resize'
      ? {
          title: t.confirmResizeTitle,
          message: t.confirmResizeBody(pending.size, pending.dropped),
          confirmLabel: t.confirmResizeYes,
          cancelLabel: t.confirmResizeNo,
        }
      : {
          title: t.confirmClearTitle,
          message: t.confirmClearBody(pricing.filled),
          confirmLabel: t.confirmClearYes,
          cancelLabel: t.confirmClearNo,
        };

  return (
    <section id="builder" className="bb" aria-labelledby="builder-heading">
      <Container className="bb-inner">
        <header className="bb-head">
          <Heading as="h2" id="builder-heading">
            {t.heading}
          </Heading>
          <Text tone="muted">{t.intro}</Text>
        </header>

        <div ref={sizesRef} className="bb-sizes-wrap">
          <SizeSelector boxes={boxes} value={box?.size ?? null} onSelect={requestSize} />
        </div>

        <BuilderDnd slots={slots} byId={byId} onDrop={applyDrop}>
          <div className="bb-layout" data-complete={editing ? undefined : 'true'}>
            <div className="bb-main">
              <div ref={boxAreaRef} className="bb-box-area">
                {box ? (
                  <BoxStage
                    cols={box.cols}
                    rows={box.rows}
                    slots={slots}
                    byId={byId}
                    selected={selectedCell}
                    onSelect={toggleSelectedCell}
                    held={held}
                    onPlaceHeld={placeHeld}
                    onReplaceHeld={placeHeld}
                    fresh={fresh}
                    onRemove={remove}
                    closed={lidClosed}
                    locked={!editing}
                    ribbon={ribbon}
                    instant={instant}
                  />
                ) : null}
              </div>

              {editing ? (
                <div className="bb-summary-area">
                  {held ? (
                    <HoldBar name={held.name} placed={placedCount} onDone={finishHold} />
                  ) : null}
                  {held && !boxVisible ? (
                    <button type="button" className="bb-viewbox" onClick={scrollToBox}>
                      {t.viewBox}
                    </button>
                  ) : null}
                  <SummaryBar
                    pricing={pricing}
                    onFillRandom={doFillRandom}
                    onClear={() => setPending({ kind: 'clear' })}
                  />
                </div>
              ) : null}
            </div>

            {editing ? (
              <TrayDropZone className="bb-tray-area">
                <CatalogTray
                  chocolates={chocolates}
                  counts={counts}
                  full={full}
                  heldId={held?.id ?? null}
                  selectedCell={selectedCell}
                  dragId={trayItemId}
                  onAdd={add}
                  onPick={pick}
                  onPlaceInCell={placeInSelectedCell}
                  onDetails={setDetail}
                  ignoreClick={justDragged}
                />
              </TrayDropZone>
            ) : (
              <div ref={panelRef} className="bb-tray-area">
                <CompletePanel
                  phase={phase}
                  size={capacity}
                  total={pricing.total}
                  onReopen={reopen}
                />
              </div>
            )}
          </div>
        </BuilderDnd>
      </Container>

      <div
        id="builder-live"
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <span key={message.n}>{message.text}</span>
      </div>

      <ConfirmDialog
        open={pending !== null}
        {...confirmProps}
        onConfirm={confirm}
        onCancel={cancel}
      />
      <ChocolateDetails chocolate={detail} onClose={() => setDetail(null)} />
    </section>
  );
}
