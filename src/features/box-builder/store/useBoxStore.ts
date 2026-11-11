'use client';

import { useMemo } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import type { BoxOption } from '@/lib/schemas/box';
import type { Chocolate } from '@/lib/schemas/chocolate';
import * as logic from '../model/box-logic';
import type { BoxState, SlotIndex } from '../model/types';

export const BOX_STORAGE_KEY = 'kinh-thanh-box';
export const BOX_STORAGE_VERSION = 1;

type BoxActions = {
  /** Đổi size; nếu đã có viên thì áp dụng quy tắc resize. Xác nhận là việc của UI (dùng previewResize). */
  selectSize: (size: number) => void;
  placeAt: (index: SlotIndex, id: string) => void;
  /** Trả về index đã đặt, hoặc null nếu hộp đầy / chưa chọn size. */
  placeInFirstEmpty: (id: string) => SlotIndex | null;
  removeAt: (index: SlotIndex) => void;
  swap: (a: SlotIndex, b: SlotIndex) => void;
  clearAll: () => void;
  fillRandom: (chocolates: readonly Chocolate[], rng?: () => number) => void;
  setMessage: (text: string) => void;
  setFrom: (text: string) => void;
  setTo: (text: string) => void;
  reset: () => void;
  /** Làm sạch state theo catalog hiện tại; trả về các id đã bị loại. */
  sanitizeWith: (chocolates: readonly Chocolate[], boxes: readonly BoxOption[]) => string[];
};

export type BoxStore = BoxState & BoxActions;

const initialState: BoxState = { size: null, slots: [], message: '', from: '', to: '' };

/** Storage không bao giờ throw (chế độ riêng tư / bị chặn → chỉ giữ trong bộ nhớ). */
const safeStorage: StateStorage = {
  getItem: (name) => {
    try {
      return window.localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      window.localStorage.setItem(name, value);
    } catch {
      /* bỏ qua */
    }
  },
  removeItem: (name) => {
    try {
      window.localStorage.removeItem(name);
    } catch {
      /* bỏ qua */
    }
  },
};

/** Dữ liệu đọc từ storage có thể hỏng/cũ: ép về đúng hình dạng, còn lại bỏ. */
function coercePersisted(raw: unknown): BoxState {
  const r = (raw ?? {}) as Partial<Record<keyof BoxState, unknown>>;
  const size = typeof r.size === 'number' && Number.isInteger(r.size) && r.size > 0 ? r.size : null;
  const slots =
    size !== null && Array.isArray(r.slots)
      ? r.slots.map((s) => (typeof s === 'string' ? s : null))
      : [];
  const message = typeof r.message === 'string' ? logic.clampMessage(r.message) : '';
  const from = typeof r.from === 'string' ? logic.clampName(r.from) : '';
  const to = typeof r.to === 'string' ? logic.clampName(r.to) : '';
  return { size, slots: size === null ? [] : slots, message, from, to };
}

export const useBoxStore = create<BoxStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      selectSize: (size) => {
        const { size: current, slots } = get();
        if (current === size) return;
        set({ size, slots: logic.resize(slots, size) });
      },
      placeAt: (index, id) => set({ slots: logic.placeAt(get().slots, index, id) }),
      placeInFirstEmpty: (id) => {
        const { slots, index } = logic.placeInFirstEmpty(get().slots, id);
        if (index !== null) set({ slots });
        return index;
      },
      removeAt: (index) => set({ slots: logic.removeAt(get().slots, index) }),
      swap: (a, b) => set({ slots: logic.swap(get().slots, a, b) }),
      clearAll: () => set({ slots: logic.clearAll(get().slots) }),
      fillRandom: (chocolates, rng) =>
        set({ slots: logic.fillRandom(get().slots, chocolates, rng) }),
      setMessage: (text) => set({ message: logic.clampMessage(text) }),
      setFrom: (text) => set({ from: logic.clampName(text) }),
      setTo: (text) => set({ to: logic.clampName(text) }),
      reset: () => set({ ...initialState }),
      sanitizeWith: (chocolates, boxes) => {
        const { size, slots, message, from, to } = get();
        const result = logic.sanitize({ size, slots, message, from, to }, chocolates, boxes);
        set(result.state);
        return result.removedIds;
      },
    }),
    {
      name: BOX_STORAGE_KEY,
      version: BOX_STORAGE_VERSION,
      storage: createJSONStorage(() => safeStorage),
      partialize: ({ size, slots, message, from, to }) => ({ size, slots, message, from, to }),
      // Stub: v1 là phiên bản đầu. Khi đổi cấu trúc, nâng version và chuyển đổi ở đây.
      migrate: (persisted) => coercePersisted(persisted),
      merge: (persisted, current) => ({ ...current, ...coercePersisted(persisted) }),
      // Không tự đọc localStorage khi tạo store: server render ra hộp rỗng, nếu client
      // hydrate ngay bằng dữ liệu đã lưu sẽ lệch HTML (hydration mismatch) trong App Router.
      // UI gọi hydrateBoxStore() trong useEffect sau khi mount.
      skipHydration: true,
    },
  ),
);

/** Gọi trong useEffect phía client. An toàn khi gọi nhiều lần. */
export function hydrateBoxStore(): Promise<void> {
  return Promise.resolve(useBoxStore.persist.rehydrate());
}

export const selectFilledCount = (s: BoxStore): number =>
  s.slots.reduce((n, id) => (id === null ? n : n + 1), 0);

export const selectIsFull =
  (capacity: number) =>
  (s: BoxStore): boolean =>
    capacity > 0 && s.slots.length === capacity && !s.slots.includes(null);

/** Selector trả primitive/tham chiếu ổn định, rồi memo hóa: không tạo object mới mỗi render. */
export function usePricing(
  chocolates: readonly Chocolate[],
  boxes: readonly BoxOption[],
): logic.Pricing {
  const size = useBoxStore((s) => s.size);
  const slots = useBoxStore((s) => s.slots);
  return useMemo(
    () => logic.pricing({ size, slots }, chocolates, boxes),
    [size, slots, chocolates, boxes],
  );
}
