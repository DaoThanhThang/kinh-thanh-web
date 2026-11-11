'use client';

import { useEffect, useId, useRef } from 'react';
import { Button, Heading, Text } from '@/components/ui';
import { complete as t } from '@/content/complete';
import { formatVnd } from '@/lib/utils/formatVnd';
import { MESSAGE_MAX, NAME_MAX } from '../../model/box-logic';
import type { CompletionPhase } from '../../model/completion';
import { useBoxStore } from '../../store/useBoxStore';
import { MessageCard } from './MessageCard';
import './complete.css';

const STATUS: Partial<Record<CompletionPhase, string>> = {
  closing: t.statusClosing,
  tying: t.statusTying,
  opening: t.statusOpening,
};

/**
 * Bước "Hoàn tất" nằm trong #builder (không phải hộp thoại), thay chỗ khay chọn viên. Khi nắp
 * đóng và ruy băng thắt xong (phase `ready`) thì hiện thiệp: lời nhắn, "Gửi đến", "Gửi từ" (lưu
 * trong store, có persist), và nút tiếp tục tới /dat-hang.
 */
export function CompletePanel({
  phase,
  size,
  total,
  onReopen,
}: {
  phase: CompletionPhase;
  size: number;
  total: number;
  onReopen: () => void;
}) {
  const message = useBoxStore((s) => s.message);
  const from = useBoxStore((s) => s.from);
  const to = useBoxStore((s) => s.to);
  const setMessage = useBoxStore((s) => s.setMessage);
  const setFrom = useBoxStore((s) => s.setFrom);
  const setTo = useBoxStore((s) => s.setTo);
  const uid = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const ready = phase === 'ready';
  const count = Array.from(message).length;

  // Thiệp hiện ra: đưa focus về tiêu đề bước (không vào ô nhập để khỏi bật bàn phím ảo).
  const wasReady = useRef(false);
  useEffect(() => {
    if (ready && !wasReady.current) headingRef.current?.focus({ preventScroll: true });
    wasReady.current = ready;
  }, [ready]);

  const status = STATUS[phase];

  return (
    <section className="cc" aria-labelledby={`${uid}-h`} data-phase={phase}>
      <Heading as="h3" id={`${uid}-h`} ref={headingRef} tabIndex={-1} className="cc-heading">
        {t.heading}
      </Heading>
      {ready ? (
        <Text tone="muted" className="cc-lead">
          {t.lead}
        </Text>
      ) : (
        <Text tone="muted" className="cc-lead" aria-hidden="true">
          {status ?? ' '}
        </Text>
      )}

      {ready ? (
        <div className="cc-reveal">
          <MessageCard message={message} from={from} to={to} />

          <div className="cc-form">
            <div className="cc-field">
              <div className="cc-label-row">
                <label htmlFor={`${uid}-m`} className="cc-label">
                  {t.messageLabel} <span className="cc-optional">({t.messageOptional})</span>
                </label>
                <span id={`${uid}-c`} className="cc-counter tabular">
                  {t.counter(count, MESSAGE_MAX)}
                </span>
              </div>
              <textarea
                id={`${uid}-m`}
                className="cc-input cc-textarea"
                rows={3}
                value={message}
                placeholder={t.messagePlaceholder}
                aria-describedby={`${uid}-c`}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
            <div className="cc-pair">
              <div className="cc-field">
                <label htmlFor={`${uid}-t`} className="cc-label">
                  {t.toLabel}
                </label>
                <input
                  id={`${uid}-t`}
                  className="cc-input"
                  type="text"
                  value={to}
                  maxLength={NAME_MAX}
                  placeholder={t.toPlaceholder}
                  autoComplete="off"
                  onChange={(e) => setTo(e.target.value)}
                />
              </div>
              <div className="cc-field">
                <label htmlFor={`${uid}-f`} className="cc-label">
                  {t.fromLabel}
                </label>
                <input
                  id={`${uid}-f`}
                  className="cc-input"
                  type="text"
                  value={from}
                  maxLength={NAME_MAX}
                  placeholder={t.fromPlaceholder}
                  autoComplete="off"
                  onChange={(e) => setFrom(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="cc-actions">
            <p className="cc-sum tabular">
              <span>{t.boxLine(size)}</span>
              <span aria-hidden="true"> · </span>
              <span>
                {t.total} {formatVnd(total)}
              </span>
            </p>
            <Button href="/dat-hang" size="lg" className="cc-next">
              {t.next}
            </Button>
            <Button variant="ghost" onClick={onReopen} className="cc-reopen">
              {t.reopen}
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
