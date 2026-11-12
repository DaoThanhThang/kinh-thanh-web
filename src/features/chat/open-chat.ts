import { useSyncExternalStore } from 'react';

/** Sự kiện trên `window`: yêu cầu ChatWidget mở khung chat (nút "Hỏi trợ lý" ở trang Thông tin). */
export const OPEN_CHAT_EVENT = 'kt:open-chat';

export function openChat(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(OPEN_CHAT_EVENT));
}

/* Trạng thái "trợ lý đang bật" do ChatWidget báo, để nơi khác biết có nên hiện nút hay không. */
let available = false;
const listeners = new Set<() => void>();

export function setChatAvailable(value: boolean): void {
  if (available === value) return;
  available = value;
  listeners.forEach((l) => l());
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};

/** Máy chủ và lần render đầu = false (không nháy khi hydrate). */
export function useChatAvailable(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => available,
    () => false,
  );
}
