'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { chat as t } from '@/content/chat';
import type { ChatStatus } from '@/lib/chat/types';
import './launcher.css';

// Mã khung chat chỉ tải khi mở lần đầu: nút nổi chỉ vài trăm byte và không chặn LCP/cuộn.
const ChatPanel = dynamic(() => import('./ChatPanel'), { ssr: false });

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
      <path
        d="M4.5 5.5h15a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H11l-4.2 3.4a.4.4 0 0 1-.65-.3V16.5H4.5a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M12 8.3l1.5 2.2-1.5 2.2-1.5-2.2z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      />
    </svg>
  );
}

export function ChatWidget() {
  const [status, setStatus] = useState<ChatStatus | null>(null);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  // Hỏi trạng thái khi trình duyệt rảnh; tắt/không cấu hình thì không hiện gì.
  useEffect(() => {
    const ctrl = new AbortController();
    const run = () => {
      fetch('/api/chat/status', { signal: ctrl.signal, cache: 'no-store' })
        .then((r) => (r.ok ? (r.json() as Promise<ChatStatus>) : null))
        .then((s) => setStatus(s && s.enabled ? s : null))
        .catch(() => setStatus(null));
    };
    const idle = typeof window.requestIdleCallback === 'function';
    const id = idle
      ? window.requestIdleCallback(run, { timeout: 2500 })
      : window.setTimeout(run, 1200);
    return () => {
      ctrl.abort();
      if (idle) window.cancelIdleCallback(id);
      else window.clearTimeout(id);
    };
  }, []);

  // Cho nút tiếng của hero biết cần dịch sang trái bao nhiêu để không đè lên nút nổi.
  const visible = status !== null;
  useEffect(() => {
    const el = launcherRef.current;
    if (!visible || !el) return;
    const root = document.documentElement;
    const set = () => {
      root.style.setProperty('--chat-launcher-shift', `${el.offsetWidth + 12}px`);
      root.style.setProperty('--chat-launcher-lift', `${el.offsetHeight + 12}px`);
    };
    set();
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(set) : null;
    ro?.observe(el);
    return () => {
      ro?.disconnect();
      root.style.removeProperty('--chat-launcher-shift');
      root.style.removeProperty('--chat-launcher-lift');
    };
  }, [visible]);

  // Đóng khung thì trả focus về nút nổi.
  useEffect(() => {
    if (wasOpen.current && !open) launcherRef.current?.focus({ preventScroll: true });
    wasOpen.current = open;
  }, [open]);

  if (!status) return null;

  return (
    <>
      <button
        ref={launcherRef}
        type="button"
        className="chat-launcher"
        aria-label={t.launcherLabel}
        aria-expanded={open}
        aria-controls="chat-panel"
        onClick={() => {
          setLoaded(true);
          setOpen((v) => !v);
        }}
      >
        <ChatIcon />
        <span>{t.launcher}</span>
      </button>
      {loaded ? <ChatPanel open={open} mode={status.mode} onClose={() => setOpen(false)} /> : null}
    </>
  );
}
