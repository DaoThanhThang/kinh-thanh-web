'use client';

import { useId, useState } from 'react';

export type FaqGroup = { title: string; items: { question: string; answer: string }[] };

/**
 * Hỏi đáp dạng accordion: nút trong tiêu đề (aria-expanded/aria-controls), vùng trả lời
 * `role="region"`. Mở/đóng bằng `grid-template-rows` 0fr → 1fr (mượt, không đo chiều cao); vùng đóng
 * bị `inert` nên Tab và trình đọc màn hình bỏ qua. Mỗi lần chỉ mở một câu.
 */
export function FaqAccordion({ groups }: { groups: readonly FaqGroup[] }) {
  const uid = useId();
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="faq-groups">
      {groups.map((g, gi) => (
        <div key={g.title || gi} className="faq-group">
          {g.title ? (
            <h3 className="faq-group-title" id={`${uid}-g${gi}`}>
              {g.title}
            </h3>
          ) : null}
          <ul className="faq-list" aria-labelledby={g.title ? `${uid}-g${gi}` : undefined}>
            {g.items.map((item, i) => {
              const key = `${gi}-${i}`;
              const isOpen = open === key;
              const btnId = `${uid}-b${key}`;
              const panelId = `${uid}-p${key}`;
              return (
                <li key={key} className="faq-item" data-open={isOpen ? 'true' : undefined}>
                  <h4 className="faq-q">
                    <button
                      type="button"
                      id={btnId}
                      className="faq-trigger"
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => setOpen(isOpen ? null : key)}
                    >
                      <span>{item.question}</span>
                      <span className="faq-mark" aria-hidden="true" />
                    </button>
                  </h4>
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={btnId}
                    className="faq-panel"
                    inert={!isOpen}
                  >
                    <div className="faq-panel-inner">
                      <p className="faq-answer">{item.answer}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
