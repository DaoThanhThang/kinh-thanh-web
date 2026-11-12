'use client';

import { Button } from '@/components/ui';
import { openChat, useChatAvailable } from '@/features/chat/open-chat';

/** Mở khung chat tư vấn. Trợ lý tắt hoặc chưa sẵn sàng → không hiện gì. */
export function ChatAskButton({ children }: { children: string }) {
  const available = useChatAvailable();
  if (!available) return null;
  return (
    <Button type="button" variant="primary" onClick={openChat}>
      {children}
    </Button>
  );
}
