import { hydrateBoxStore, useBoxStore } from '@/features/box-builder';
import type { ChatSuggestion } from '@/lib/chat/types';

/** Số viên đang có trong hộp (đã nạp từ localStorage nếu trang này chưa có builder). */
export async function currentFilledCount(): Promise<number> {
  await hydrateBoxStore();
  return useBoxStore.getState().slots.filter((s) => s !== null).length;
}

/** Thay hộp hiện tại bằng gợi ý: đổi cỡ rồi đặt từng viên theo thứ tự ô. */
export function applySuggestion(s: ChatSuggestion): void {
  const store = useBoxStore.getState();
  store.clearAll();
  store.selectSize(s.size);
  s.pieces.forEach((id, i) => useBoxStore.getState().placeAt(i, id));
}
