import type { ChatMessage } from './types';

export const CHAT_STORAGE_KEY = 'kinh-thanh-chat';

/** sessionStorage có thể bị chặn / đầy: mọi truy cập đều bọc try/catch. */
export function loadMessages(): ChatMessage[] {
  try {
    const raw = window.sessionStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return [];
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data
      .filter(
        (m): m is ChatMessage =>
          !!m &&
          typeof m === 'object' &&
          (m.role === 'user' || m.role === 'assistant') &&
          typeof m.content === 'string' &&
          typeof m.id === 'string',
      )
      .slice(-40);
  } catch {
    return [];
  }
}

export function saveMessages(messages: ChatMessage[]): void {
  try {
    if (messages.length === 0) window.sessionStorage.removeItem(CHAT_STORAGE_KEY);
    else window.sessionStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages.slice(-40)));
  } catch {
    /* bỏ qua */
  }
}
