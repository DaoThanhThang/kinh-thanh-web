'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { chat as t, CHAT_LIMITS } from '@/content/chat';
import { ConfirmDialog } from '@/features/box-builder/components/builder/ConfirmDialog';
import { useBoxStore } from '@/features/box-builder';
import type { ChatSuggestion } from '@/lib/chat/types';
import { scrollToHash } from '@/lib/utils/scroll';
import { applySuggestion, currentFilledCount } from './apply-suggestion';
import { Markdown } from './Markdown';
import { SuggestionCard } from './SuggestionCard';
import { useChat } from './useChat';
import './chat.css';

const MOBILE_QUERY = '(max-width: 47.99rem)';
const FOCUSABLE =
  'button:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

function useIsMobile(): boolean {
  const [mobile, setMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia?.(MOBILE_QUERY).matches === true,
  );
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia(MOBILE_QUERY);
    const on = () => setMobile(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return mobile;
}

function boxContext() {
  const { size, slots } = useBoxStore.getState();
  const filledIds = slots.filter((s): s is string => s !== null);
  return size && filledIds.length > 0 ? { size, filledIds } : undefined;
}

export default function ChatPanel({
  open,
  mode,
  onClose,
}: {
  open: boolean;
  mode: 'live' | 'mock';
  onClose: () => void;
}) {
  const router = useRouter();
  const mobile = useIsMobile();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const stickRef = useRef(true);
  const { messages, streaming, announcement, send, retry, stop, reset } = useChat(boxContext);
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState<{ suggestion: ChatSuggestion; filled: number } | null>(
    null,
  );
  const [appliedId, setAppliedId] = useState<string | null>(null);

  // Mở: đưa focus vào ô nhập (desktop) hoặc vào khung (mobile, tránh bật bàn phím ngay).
  useEffect(() => {
    if (!open) return;
    const el = mobile ? panelRef.current : inputRef.current;
    el?.focus({ preventScroll: true });
  }, [open, mobile]);

  // Mobile: khoá cuộn nền, bám theo viewport thật khi bàn phím ảo mở.
  useEffect(() => {
    if (!open || !mobile) return;
    const root = document.documentElement;
    const prevOverflow = root.style.overflow;
    root.style.overflow = 'hidden';
    const vv = window.visualViewport;
    const panel = panelRef.current;
    const sync = () => {
      if (!vv || !panel) return;
      panel.style.setProperty('--chat-vvh', `${vv.height}px`);
      panel.style.setProperty('--chat-vvt', `${vv.offsetTop}px`);
    };
    sync();
    vv?.addEventListener('resize', sync);
    vv?.addEventListener('scroll', sync);
    return () => {
      root.style.overflow = prevOverflow;
      vv?.removeEventListener('resize', sync);
      vv?.removeEventListener('scroll', sync);
      panel?.style.removeProperty('--chat-vvh');
      panel?.style.removeProperty('--chat-vvt');
    };
  }, [open, mobile]);

  // Tự cuộn xuống cuối khi có chữ mới, trừ khi khách đã cuộn lên đọc.
  useEffect(() => {
    const el = scrollRef.current;
    if (el && stickRef.current) el.scrollTop = el.scrollHeight;
  }, [messages, streaming, open]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (el) stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
  };

  const resizeInput = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 112)}px`;
  }, []);
  useEffect(resizeInput, [draft, resizeInput]);

  const submit = (text: string) => {
    stickRef.current = true;
    setAppliedId(null);
    if (send(text)) {
      setDraft('');
    }
  };

  const onInputKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Bỏ qua Enter khi đang gõ dấu bằng bộ gõ (Telex/VNI/IME).
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (!streaming) submit(draft);
    }
  };

  const onPanelKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape' && !e.defaultPrevented) {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key === 'Tab' && mobile) {
      const nodes = [...(panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])].filter(
        (n) => n.offsetParent !== null || n === document.activeElement,
      );
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (!first || !last) return;
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === panelRef.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  const place = (s: ChatSuggestion, messageId: string) => {
    applySuggestion(s);
    setAppliedId(messageId);
    if (mobile) onClose();
    // Chờ panel đóng (mobile mở lại cuộn nền) rồi mới cuộn tới hộp.
    window.setTimeout(() => {
      if (!scrollToHash('builder')) router.push('/#builder');
    }, 80);
  };

  const requestApply = async (s: ChatSuggestion, messageId: string) => {
    const filled = await currentFilledCount();
    if (filled > 0) setPending({ suggestion: s, filled });
    else place(s, messageId);
  };

  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
  const waiting = streaming && lastAssistant && !lastAssistant.content && !lastAssistant.suggestion;
  const length = Array.from(draft).length;
  const nearLimit = length >= CHAT_LIMITS.userMax - 60;

  return (
    <>
      <div
        ref={panelRef}
        id="chat-panel"
        className="chat-panel"
        role="dialog"
        aria-modal={mobile ? true : undefined}
        aria-labelledby={titleId}
        tabIndex={-1}
        hidden={!open}
        onKeyDown={onPanelKeyDown}
      >
        <header className="chat-head">
          <h2 id={titleId} className="chat-title">
            {t.panelTitle}
          </h2>
          {messages.length > 0 ? (
            <button type="button" className="chat-head-btn" onClick={reset}>
              {t.restart}
            </button>
          ) : null}
          <button
            type="button"
            className="chat-head-btn chat-close"
            onClick={onClose}
            aria-label={t.closeLabel}
          >
            <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
              <path d="M3 3l10 10M13 3L3 13" fill="none" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          </button>
        </header>

        <div
          ref={scrollRef}
          className="chat-scroll"
          role="region"
          aria-label={t.messagesLabel}
          tabIndex={0}
          onScroll={onScroll}
        >
          <div className="chat-msg" data-role="assistant">
            <span className="sr-only">{t.assistantSaid}: </span>
            <div className="chat-bubble">
              <p>{t.greeting}</p>
            </div>
          </div>

          {messages.length === 0 ? (
            <div className="chat-quick" role="group" aria-label={t.quickRepliesLabel}>
              {t.quickReplies.map((q) => (
                <button key={q} type="button" className="chat-chip" onClick={() => submit(q)}>
                  {q}
                </button>
              ))}
            </div>
          ) : null}

          {messages.map((m) => {
            if (m.role === 'assistant' && !m.content && !m.suggestion && !m.error) return null;
            return (
              <div key={m.id} className="chat-msg" data-role={m.role}>
                <span className="sr-only">{m.role === 'user' ? t.youSaid : t.assistantSaid}: </span>
                {m.content || m.error ? (
                  <div className="chat-bubble" data-error={m.error ? 'true' : undefined}>
                    {m.role === 'user' ? (
                      <p className="chat-plain">{m.content}</p>
                    ) : m.error && !m.content ? (
                      <p role="alert">{m.error}</p>
                    ) : (
                      <Markdown text={m.content} />
                    )}
                    {m.error && m.content ? <p role="alert">{m.error}</p> : null}
                    {m.error && m.id === lastAssistant?.id ? (
                      <button type="button" className="chat-retry" onClick={retry}>
                        {t.retry}
                      </button>
                    ) : null}
                    {m.stopped ? <p className="chat-stopped">{t.stopped}</p> : null}
                  </div>
                ) : null}
                {m.suggestion ? (
                  <SuggestionCard
                    suggestion={m.suggestion}
                    applied={appliedId === m.id}
                    onApply={(s) => void requestApply(s, m.id)}
                  />
                ) : null}
              </div>
            );
          })}

          {waiting ? (
            <div className="chat-msg" data-role="assistant">
              <div className="chat-bubble chat-typing">
                <span className="sr-only">{t.typing}</span>
                <span className="chat-dots" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
              </div>
            </div>
          ) : null}
        </div>

        <form
          className="chat-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!streaming) submit(draft);
          }}
        >
          <div className="chat-inputrow">
            <textarea
              ref={inputRef}
              className="chat-input"
              rows={1}
              maxLength={CHAT_LIMITS.userMax}
              value={draft}
              placeholder={t.inputPlaceholder}
              aria-label={t.inputLabel}
              enterKeyHint="send"
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onInputKeyDown}
            />
            {streaming ? (
              <button type="button" className="chat-send" onClick={stop}>
                {t.stop}
              </button>
            ) : (
              <button type="submit" className="chat-send" disabled={draft.trim() === ''}>
                {t.send}
              </button>
            )}
          </div>
          <div className="chat-meta">
            <p className="chat-note">
              {t.footnote}
              {mode === 'mock' ? ` ${t.mockNote}` : ''}
            </p>
            <p className="chat-count tabular" data-near={nearLimit ? 'true' : undefined}>
              {t.counter(length, CHAT_LIMITS.userMax)}
            </p>
          </div>
        </form>

        <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          <span key={announcement.n}>{announcement.text}</span>
        </div>
      </div>

      <ConfirmDialog
        open={pending !== null}
        title={t.suggestion.confirmTitle}
        message={pending ? t.suggestion.confirmBody(pending.filled) : ''}
        confirmLabel={t.suggestion.confirmYes}
        cancelLabel={t.suggestion.confirmNo}
        onCancel={() => setPending(null)}
        onConfirm={() => {
          const p = pending;
          setPending(null);
          const owner = [...messages].reverse().find((m) => m.suggestion === p?.suggestion);
          if (p) place(p.suggestion, owner?.id ?? '');
        }}
      />
    </>
  );
}
