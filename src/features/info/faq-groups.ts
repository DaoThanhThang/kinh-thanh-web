import type { FaqGroup } from './FaqAccordion';

type FaqEntry = { question: string; answer: string; group: string };

/** Gom câu hỏi theo `group`, giữ thứ tự xuất hiện đầu tiên; câu không có nhóm xếp nhóm cuối, không tiêu đề. */
export function groupFaq(faq: readonly FaqEntry[]): FaqGroup[] {
  const named = new Map<string, FaqGroup>();
  const loose: FaqGroup = { title: '', items: [] };
  for (const { question, answer, group } of faq) {
    const title = group.trim();
    if (!title) {
      loose.items.push({ question, answer });
      continue;
    }
    const g = named.get(title) ?? { title, items: [] };
    g.items.push({ question, answer });
    named.set(title, g);
  }
  const groups = [...named.values()];
  if (loose.items.length > 0) groups.push(loose);
  return groups;
}
