import type { ReactNode } from 'react';

/**
 * Markdown tối thiểu, an toàn: chỉ **đậm**, danh sách gạch đầu dòng / đánh số và xuống dòng.
 * Mọi thứ được dựng thành phần tử React (React tự escape), không dùng dangerouslySetInnerHTML,
 * nên HTML thô trong tin nhắn chỉ hiện thành chữ.
 */
function inline(text: string, keyBase: string): ReactNode[] {
  return text
    .split(/(\*\*[^*\n]+\*\*)/g)
    .map((part, i) =>
      /^\*\*[^*\n]+\*\*$/.test(part) ? (
        <strong key={`${keyBase}-${i}`}>{part.slice(2, -2)}</strong>
      ) : (
        part
      ),
    );
}

type Block = { kind: 'p'; lines: string[] } | { kind: 'ul' | 'ol'; items: string[] };

function parse(text: string): Block[] {
  const blocks: Block[] = [];
  for (const line of text.replace(/\r\n?/g, '\n').split('\n')) {
    const ul = /^\s*[-*•]\s+(.*)$/.exec(line);
    const ol = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    const last = blocks[blocks.length - 1];
    if (ul || ol) {
      const kind = ul ? 'ul' : 'ol';
      const item = (ul ?? ol)?.[1] ?? '';
      if (last && last.kind === kind) last.items.push(item);
      else blocks.push({ kind, items: [item] });
    } else if (line.trim() === '') {
      if (last && last.kind === 'p' && last.lines.length > 0) blocks.push({ kind: 'p', lines: [] });
    } else if (last && last.kind === 'p') last.lines.push(line);
    else blocks.push({ kind: 'p', lines: [line] });
  }
  return blocks.filter((b) => (b.kind === 'p' ? b.lines.length > 0 : true));
}

export function Markdown({ text }: { text: string }) {
  return (
    <>
      {parse(text).map((b, i) => {
        if (b.kind === 'p') {
          return (
            <p key={i}>
              {b.lines.map((l, j) => (
                <span key={j}>
                  {j > 0 ? <br /> : null}
                  {inline(l, `${i}-${j}`)}
                </span>
              ))}
            </p>
          );
        }
        const Tag = b.kind;
        return (
          <Tag key={i}>
            {b.items.map((it, j) => (
              <li key={j}>{inline(it, `${i}-${j}`)}</li>
            ))}
          </Tag>
        );
      })}
    </>
  );
}
