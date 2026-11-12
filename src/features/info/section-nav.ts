export type SectionTop = { id: string; top: number };

/**
 * Mục đang đọc: mục cuối cùng có mép trên đã đi qua `line` (px tính từ đỉnh khung nhìn).
 * Chưa mục nào qua vạch → mục đầu. Cuộn tới đáy trang → mục cuối (mục cuối có thể không bao giờ
 * chạm vạch khi phần dưới trang ngắn).
 */
export function activeSectionId(
  sections: readonly SectionTop[],
  line: number,
  atBottom = false,
): string | null {
  if (sections.length === 0) return null;
  if (atBottom) return sections[sections.length - 1]?.id ?? null;
  let active = sections[0]?.id ?? null;
  for (const s of sections) {
    if (s.top <= line) active = s.id;
  }
  return active;
}
