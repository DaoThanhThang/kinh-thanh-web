import type { ChatSuggestion } from '@/lib/chat/types';

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestion?: ChatSuggestion;
  /** Lượt trả lời lỗi: hiện thông báo + nút thử lại thay cho nội dung. */
  error?: string;
  stopped?: boolean;
};
