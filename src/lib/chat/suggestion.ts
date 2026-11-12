import type { BoxOption } from '@/lib/schemas/box';
import type { Chocolate } from '@/lib/schemas/chocolate';
import type { ChatSuggestion } from './types';

export const TITLE_MAX = 60;
export const REASON_MAX = 200;

const clip = (s: string, max: number): string => {
  const chars = Array.from(s.trim().replace(/\s+/g, ' '));
  return chars.length <= max
    ? chars.join('')
    : `${chars
        .slice(0, max - 1)
        .join('')
        .trimEnd()}…`;
};

/**
 * Kiểm đầu vào tool `suggest_box` do model sinh ra (không tin tưởng) và dựng gợi ý cho client.
 * - size phải là cỡ hộp có thật, không thì bỏ.
 * - id lạ / hết hàng bị loại; nếu còn ít hơn một nửa số viên model đưa ra (hoặc không còn viên nào) → bỏ.
 * - thiếu viên → lặp lại các viên hợp lệ theo vòng cho đủ `size`; thừa → cắt.
 * - giá luôn tính lại ở server từ catalog.
 */
export function resolveSuggestion(
  input: unknown,
  chocolates: readonly Chocolate[],
  boxes: readonly BoxOption[],
): ChatSuggestion | null {
  if (!input || typeof input !== 'object') return null;
  const raw = input as Record<string, unknown>;

  const box = boxes.find((b) => b.size === raw.size);
  if (!box) return null;
  if (!Array.isArray(raw.pieces)) return null;

  const byId = new Map(chocolates.map((c) => [c.id, c]));
  const given = raw.pieces.filter((p): p is string => typeof p === 'string');
  const valid = given.filter((id) => byId.get(id)?.available === true);
  if (valid.length === 0 || valid.length * 2 < raw.pieces.length) return null;

  const pieces: string[] = [];
  for (let i = 0; i < box.size; i++) pieces.push(valid[i % valid.length] as string);

  const distinct = [...new Set(pieces)];
  const items = distinct.map((id) => {
    const c = byId.get(id) as Chocolate;
    return { id, name: c.name, image: c.image, price: c.price };
  });
  const piecesPrice = pieces.reduce((sum, id) => sum + (byId.get(id)?.price ?? 0), 0);

  const title = typeof raw.title === 'string' && raw.title.trim() ? raw.title : box.name;
  const reason = typeof raw.reason === 'string' ? raw.reason : '';
  return {
    size: box.size,
    cols: box.cols,
    rows: box.rows,
    pieces,
    items,
    title: clip(title, TITLE_MAX),
    reason: clip(reason, REASON_MAX),
    boxPrice: box.price,
    total: box.price + piecesPrice,
  };
}
