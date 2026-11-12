import type { ChatEvent } from '@/lib/chat/types';

/** Đọc luồng NDJSON, gọi `onEvent` cho từng dòng hợp lệ; dòng hỏng bị bỏ qua. */
export async function readEvents(res: Response, onEvent: (e: ChatEvent) => void): Promise<void> {
  if (!res.body) return;
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  const flush = (line: string) => {
    if (!line.trim()) return;
    try {
      const ev = JSON.parse(line) as ChatEvent;
      if (ev && typeof ev === 'object' && typeof ev.type === 'string') onEvent(ev);
    } catch {
      /* bỏ dòng hỏng */
    }
  };
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let nl = buffer.indexOf('\n');
    while (nl >= 0) {
      flush(buffer.slice(0, nl));
      buffer = buffer.slice(nl + 1);
      nl = buffer.indexOf('\n');
    }
  }
  buffer += decoder.decode();
  flush(buffer);
}
