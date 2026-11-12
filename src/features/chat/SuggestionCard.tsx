'use client';

import { useId, useState } from 'react';
import { Button } from '@/components/ui';
import { chat } from '@/content/chat';
import { ChocolateImage } from '@/features/catalog/components/ChocolateImage';
import type { ChatSuggestion } from '@/lib/chat/types';
import { formatVnd } from '@/lib/utils/formatVnd';

const t = chat.suggestion;

export function SuggestionCard({
  suggestion: s,
  applied,
  onApply,
}: {
  suggestion: ChatSuggestion;
  applied: boolean;
  onApply: (s: ChatSuggestion) => void;
}) {
  const [showPieces, setShowPieces] = useState(false);
  const listId = useId();
  const byId = new Map(s.items.map((i) => [i.id, i]));

  return (
    <section className="chat-card" aria-label={t.heading}>
      <h3 className="chat-card-title">{s.title}</h3>
      <div
        className="chat-card-grid"
        role="img"
        aria-label={t.previewLabel(s.title, s.size)}
        style={{ gridTemplateColumns: `repeat(${s.cols}, minmax(0, 1fr))` }}
      >
        {s.pieces.map((id, i) => {
          const item = byId.get(id);
          return (
            <span key={i} className="chat-card-cell">
              {item ? <ChocolateImage src={item.image} alt="" width={48} height={48} /> : null}
            </span>
          );
        })}
      </div>
      {s.reason ? <p className="chat-card-reason">{s.reason}</p> : null}
      <p className="chat-card-total tabular">
        <span>{t.total}</span> <strong>{formatVnd(s.total)}</strong>
      </p>
      <div className="chat-card-actions">
        <Button
          size="md"
          className="chat-card-apply"
          onClick={() => onApply(s)}
          aria-describedby={applied ? `${listId}-done` : undefined}
        >
          {t.apply}
        </Button>
        <button
          type="button"
          className="chat-card-toggle"
          aria-expanded={showPieces}
          aria-controls={listId}
          onClick={() => setShowPieces((v) => !v)}
        >
          {showPieces ? t.hidePieces : t.showPieces}
        </button>
      </div>
      {applied ? (
        <p id={`${listId}-done`} className="chat-card-done" role="status">
          {t.applied}
        </p>
      ) : null}
      <ol id={listId} className="chat-card-list" aria-label={t.piecesLabel} hidden={!showPieces}>
        {s.pieces.map((id, i) => (
          <li key={i}>{byId.get(id)?.name ?? id}</li>
        ))}
      </ol>
    </section>
  );
}
