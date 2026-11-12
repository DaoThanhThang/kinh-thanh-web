'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CHAT_LIMITS, chat as t } from '@/content/chat';
import type { ChatSuggestion } from '@/lib/chat/types';
import { readEvents } from './stream';
import { loadMessages, saveMessages } from './storage';
import type { ChatMessage } from './types';

type BoxContext = { size: number; filledIds: string[] } | undefined;

let seq = 0;
const newId = () => `m${Date.now().toString(36)}${(seq++).toString(36)}`;

const noteFor = (s: ChatSuggestion) =>
  `[Đã hiển thị gợi ý hộp "${s.title}" ${s.size} viên: ${s.pieces.join(', ')}]`;

/** Chuyển lịch sử cục bộ thành thân yêu cầu: bỏ lượt lỗi/rỗng, bắt đầu bằng tin người dùng, tối đa 16 tin. */
export function toApiMessages(
  messages: readonly ChatMessage[],
): { role: 'user' | 'assistant'; content: string }[] {
  const out = messages
    .filter((m) => !m.error)
    .map((m) => ({
      role: m.role,
      content: (m.suggestion ? `${m.content}\n${noteFor(m.suggestion)}`.trim() : m.content).slice(
        0,
        m.role === 'user' ? CHAT_LIMITS.userMax : CHAT_LIMITS.assistantMax,
      ),
    }))
    .filter((m) => m.content.trim() !== '');
  const tail = out.slice(-CHAT_LIMITS.maxMessages);
  while (tail[0]?.role === 'assistant') tail.shift();
  return tail;
}

async function errorMessageFrom(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: unknown };
    if (typeof body.error === 'string' && body.error) return body.error;
  } catch {
    /* không phải JSON */
  }
  return t.errors.failed;
}

export function useChat(getBoxContext: () => BoxContext) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadMessages());
  const [streaming, setStreaming] = useState(false);
  const [announcement, setAnnouncement] = useState({ text: '', n: 0 });
  const messagesRef = useRef(messages);
  const abortRef = useRef<AbortController | null>(null);
  const streamingRef = useRef(false);

  useEffect(() => {
    messagesRef.current = messages;
    if (!streaming) saveMessages(messages);
  }, [messages, streaming]);

  const announce = useCallback(
    (text: string) => setAnnouncement((a) => ({ text, n: a.n + 1 })),
    [],
  );

  const patch = useCallback((id: string, fn: (m: ChatMessage) => ChatMessage) => {
    setMessages((list) => list.map((m) => (m.id === id ? fn(m) : m)));
  }, []);

  const run = useCallback(
    async (history: ChatMessage[], assistantId: string) => {
      const controller = new AbortController();
      abortRef.current = controller;
      streamingRef.current = true;
      setStreaming(true);

      let text = '';
      let suggested = false;
      let failed = false;
      const fail = (message: string) => {
        failed = true;
        patch(assistantId, (m) => ({ ...m, error: message }));
      };

      try {
        const boxContext = getBoxContext();
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: toApiMessages(history),
            ...(boxContext && { boxContext }),
          }),
          signal: controller.signal,
        });
        if (!res.ok) {
          fail(await errorMessageFrom(res));
        } else {
          await readEvents(res, (ev) => {
            if (ev.type === 'text') {
              text += ev.delta;
              patch(assistantId, (m) => ({ ...m, content: m.content + ev.delta }));
            } else if (ev.type === 'suggestion') {
              suggested = true;
              patch(assistantId, (m) => ({ ...m, suggestion: ev.data }));
            } else if (ev.type === 'error') {
              fail(ev.message || t.errors.failed);
            }
          });
        }
      } catch (err) {
        if ((err as { name?: string } | null)?.name === 'AbortError') {
          patch(assistantId, (m) => ({ ...m, stopped: true }));
        } else {
          fail(t.errors.network);
        }
      } finally {
        abortRef.current = null;
        streamingRef.current = false;
        setStreaming(false);
        // Lượt rỗng (bị dừng trước khi có chữ): bỏ khỏi danh sách.
        setMessages((list) =>
          list.filter((m) => !(m.id === assistantId && !m.content && !m.suggestion && !m.error)),
        );
        if (!failed && (text || suggested)) {
          announce(text ? t.announceDone(text.slice(0, 240)) : t.announceSuggestion);
        }
      }
    },
    [announce, getBoxContext, patch],
  );

  const send = useCallback(
    (raw: string) => {
      const content = raw.trim().slice(0, CHAT_LIMITS.userMax);
      if (!content || streamingRef.current) return false;
      const user: ChatMessage = { id: newId(), role: 'user', content };
      const assistant: ChatMessage = { id: newId(), role: 'assistant', content: '' };
      const history = [...messagesRef.current, user];
      messagesRef.current = [...history, assistant];
      setMessages(messagesRef.current);
      void run(history, assistant.id);
      return true;
    },
    [run],
  );

  const retry = useCallback(() => {
    if (streamingRef.current) return;
    const list = messagesRef.current;
    const last = list[list.length - 1];
    if (!last || last.role !== 'assistant' || !last.error) return;
    const history = list.slice(0, -1);
    const assistant: ChatMessage = { id: newId(), role: 'assistant', content: '' };
    messagesRef.current = [...history, assistant];
    setMessages(messagesRef.current);
    void run(history, assistant.id);
  }, [run]);

  const stop = useCallback(() => abortRef.current?.abort(), []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    messagesRef.current = [];
    setMessages([]);
    saveMessages([]);
  }, []);

  return { messages, streaming, announcement, send, retry, stop, reset };
}
