import type { BoxOption } from '@/lib/schemas/box';
import type { Chocolate } from '@/lib/schemas/chocolate';
import type { BoxState, SlotIndex, Slots } from './types';

/** Độ dài tối đa lời nhắn (đếm theo code point). */
export const MESSAGE_MAX = 150;
/** Độ dài tối đa ô "Gửi từ" / "Gửi đến" (đếm theo code point). */
export const NAME_MAX = 40;

export function createSlots(size: number): Slots {
  const n = Number.isInteger(size) && size > 0 ? size : 0;
  return Array.from({ length: n }, () => null);
}

function inRange(slots: Slots, index: SlotIndex): boolean {
  return Number.isInteger(index) && index >= 0 && index < slots.length;
}

/** Đặt viên vào ô, thay viên đang có. Index ngoài phạm vi → không đổi. */
export function placeAt(slots: Slots, index: SlotIndex, id: string): Slots {
  if (!inRange(slots, index)) return slots;
  const next = slots.slice();
  next[index] = id;
  return next;
}

/** Đặt vào ô trống đầu tiên. index = null khi hộp đã đầy (slots không đổi). */
export function placeInFirstEmpty(
  slots: Slots,
  id: string,
): { slots: Slots; index: SlotIndex | null } {
  const index = slots.indexOf(null);
  if (index === -1) return { slots, index: null };
  return { slots: placeAt(slots, index, id), index };
}

export function removeAt(slots: Slots, index: SlotIndex): Slots {
  if (!inRange(slots, index) || slots[index] === null) return slots;
  const next = slots.slice();
  next[index] = null;
  return next;
}

/** Hoán đổi hai ô. Cũng dùng để chuyển viên sang ô trống. */
export function swap(slots: Slots, a: SlotIndex, b: SlotIndex): Slots {
  if (!inRange(slots, a) || !inRange(slots, b) || a === b) return slots;
  const next = slots.slice();
  next[a] = slots[b] ?? null;
  next[b] = slots[a] ?? null;
  return next;
}

export function clearAll(slots: Slots): Slots {
  return slots.map(() => null);
}

/** Điền ngẫu nhiên các ô TRỐNG bằng viên còn bán (được lặp). Không có viên nào → không đổi. */
export function fillRandom(
  slots: Slots,
  chocolates: readonly Chocolate[],
  rng: () => number = Math.random,
): Slots {
  const pool = chocolates.filter((c) => c.available);
  if (pool.length === 0 || !slots.includes(null)) return slots;
  return slots.map((s) => {
    if (s !== null) return s;
    const i = Math.min(pool.length - 1, Math.max(0, Math.floor(rng() * pool.length)));
    return pool[i]?.id ?? null;
  });
}

/**
 * Quy tắc đổi size (D19): giữ các viên theo thứ tự ô cũ (index tăng dần), dồn
 * vào các ô đầu của hộp mới; viên không còn chỗ nằm trong `dropped` (đúng thứ tự).
 */
export function previewResize(slots: Slots, newSize: number): { kept: Slots; dropped: string[] } {
  const filled = slots.filter((s): s is string => s !== null);
  const kept = createSlots(newSize);
  filled.slice(0, kept.length).forEach((id, i) => {
    kept[i] = id;
  });
  return { kept, dropped: filled.slice(kept.length) };
}

export function resize(slots: Slots, newSize: number): Slots {
  return previewResize(slots, newSize).kept;
}

export function countById(slots: Slots): Record<string, number> {
  const out: Record<string, number> = {};
  for (const s of slots) if (s !== null) out[s] = (out[s] ?? 0) + 1;
  return out;
}

export type Pricing = {
  boxPrice: number;
  piecesPrice: number;
  total: number;
  filled: number;
  capacity: number;
  isFull: boolean;
  isEmpty: boolean;
};

/** Giá (VND, số nguyên). Id không có trong catalog bị bỏ qua khi tính giá nhưng vẫn tính là ô đã lấp. */
export function pricing(
  state: Pick<BoxState, 'size' | 'slots'>,
  chocolates: readonly Chocolate[],
  boxes: readonly BoxOption[],
): Pricing {
  const box = boxes.find((b) => b.size === state.size);
  const boxPrice = box?.price ?? 0;
  const priceById = new Map(chocolates.map((c) => [c.id, c.price]));
  let piecesPrice = 0;
  let filled = 0;
  for (const id of state.slots) {
    if (id === null) continue;
    filled += 1;
    piecesPrice += priceById.get(id) ?? 0;
  }
  const capacity = state.slots.length;
  return {
    boxPrice,
    piecesPrice,
    total: boxPrice + piecesPrice,
    filled,
    capacity,
    isFull: capacity > 0 && filled === capacity,
    isEmpty: filled === 0,
  };
}

/** Chuẩn hóa NFC và cắt theo code point (không làm vỡ emoji / chữ có dấu đã gộp). */
export function clampMessage(text: string, max: number = MESSAGE_MAX): string {
  const chars = Array.from(text.normalize('NFC'));
  return chars.length <= max ? chars.join('') : chars.slice(0, max).join('');
}

/** Tên người gửi/nhận: một dòng (xuống dòng thành dấu cách), NFC, cắt tối đa NAME_MAX. */
export function clampName(text: string, max: number = NAME_MAX): string {
  return clampMessage(text.replace(/[\r\n\u2028\u2029]+/g, ' '), max);
}

export type SanitizeResult = { state: BoxState; removedIds: string[] };

/**
 * Làm sạch state sau khi đọc từ localStorage / khi catalog đổi:
 * - size không có trong boxes → null, xóa hết ô;
 * - độ dài slots ép về size (cắt bớt / thêm ô trống);
 * - id không có trong catalog hoặc không còn bán → null, ghi vào removedIds;
 * - message: NFC + cắt tối đa MESSAGE_MAX; from/to: một dòng, cắt tối đa NAME_MAX.
 */
export function sanitize(
  state: BoxState,
  chocolates: readonly Chocolate[],
  boxes: readonly BoxOption[],
): SanitizeResult {
  const message = clampMessage(state.message);
  const from = clampName(state.from);
  const to = clampName(state.to);
  const sizeOk = state.size !== null && boxes.some((b) => b.size === state.size);
  if (!sizeOk) {
    const removedIds = state.slots.filter((s): s is string => s !== null);
    return { state: { size: null, slots: [], message, from, to }, removedIds };
  }
  const size = state.size as number;
  const okIds = new Set(chocolates.filter((c) => c.available).map((c) => c.id));
  const removedIds: string[] = [];
  const slots = createSlots(size);
  state.slots.forEach((id, i) => {
    if (id === null) return;
    if (i >= size) {
      removedIds.push(id);
    } else if (okIds.has(id)) {
      slots[i] = id;
    } else {
      removedIds.push(id);
    }
  });
  return { state: { size, slots, message, from, to }, removedIds };
}
