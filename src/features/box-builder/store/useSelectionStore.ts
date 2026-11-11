'use client';

import { create } from 'zustand';

/**
 * Trạng thái chọn tạm của builder (không lưu): viên đang cầm (chạm-để-đặt) và ô trống đang chọn.
 * Hai trạng thái loại trừ nhau: cầm viên thì bỏ chọn ô, chọn ô thì thả viên.
 */
export type SelectionState = {
  /** Id viên đang cầm. */
  held: string | null;
  /** Số viên đã đặt từ lần cầm này (đổi nhãn "Huỷ" → "Xong"). */
  placed: number;
  /** Ô trống đang chọn. */
  cell: number | null;
};

type SelectionActions = {
  /** Cầm viên; bấm lại đúng viên đó thì thả. */
  toggleHold: (id: string) => void;
  release: () => void;
  notePlaced: () => void;
  /** Chọn ô; bấm lại đúng ô đó (hoặc null) thì bỏ chọn. */
  toggleCell: (index: number | null) => void;
  clearCell: () => void;
  reset: () => void;
};

const initial: SelectionState = { held: null, placed: 0, cell: null };

export const useSelectionStore = create<SelectionState & SelectionActions>()((set, get) => ({
  ...initial,
  toggleHold: (id) => set(get().held === id ? { ...initial } : { held: id, placed: 0, cell: null }),
  release: () => set({ held: null, placed: 0 }),
  notePlaced: () => set((s) => ({ placed: s.placed + 1 })),
  toggleCell: (index) =>
    set((s) =>
      index === null || s.cell === index ? { cell: null } : { cell: index, held: null, placed: 0 },
    ),
  clearCell: () => set({ cell: null }),
  reset: () => set({ ...initial }),
}));
