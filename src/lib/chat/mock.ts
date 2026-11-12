import type { ModelArgs, ModelEvent } from './handle-chat';

/** Độ trễ giữa các mẩu chữ của mock (ms); test đặt 0. */
export const mockDelay = { ms: 28 };

const sleep = (ms: number) => (ms > 0 ? new Promise((r) => setTimeout(r, ms)) : Promise.resolve());

/**
 * Chế độ thử (không có ANTHROPIC_API_KEY, chạy cục bộ): trả lời mẫu để dựng và kiểm giao diện.
 * Không gọi mạng. Có từ khoá "ít ngọt" → chỉ trả lời chữ; còn lại kèm một gợi ý hộp.
 */
export async function* mockModel(args: ModelArgs): AsyncGenerator<ModelEvent> {
  const last = [...args.messages].reverse().find((m) => m.role === 'user')?.content ?? '';
  const available = args.catalog.chocolates.filter((c) => c.available);
  const lowSweet = /ít ngọt/i.test(last);

  const reply = lowSweet
    ? 'Về độ ngọt, thông tin hương vị của từng viên đang được cập nhật nên Kinh Thành chưa dám khẳng định viên nào ít ngọt. Bạn cho mình biết bạn thích vị đậm đắng hay dịu nhẹ, mình sẽ gợi ý hướng chọn nhé?'
    : 'Mình gợi ý một hộp gồm vài viên đa dạng để người nhận có thể thử nhiều vị. Bạn xem thử hộp dưới đây nhé, nếu muốn mình điều chỉnh theo khẩu vị hay ngân sách thì cứ nói.';

  for (const part of reply.match(/\S+\s*/g) ?? []) {
    if (args.signal.aborted) return;
    yield { type: 'text', delta: part };
    await sleep(mockDelay.ms);
  }

  if (!lowSweet && available.length > 0) {
    const size = /500|đối tác/i.test(last) ? 9 : 6;
    yield {
      type: 'tool',
      name: 'suggest_box',
      input: {
        size,
        pieces: Array.from({ length: size }, (_, i) => available[i % available.length]?.id),
        title: size === 9 ? 'Hộp quà tặng đối tác' : 'Hộp quà vài vị cho dịp đặc biệt',
        reason: 'Mỗi viên một vị khác nhau, vừa đủ để người nhận khám phá mà không bị ngấy.',
      },
    };
  }
  yield { type: 'usage', input: 0, cacheRead: 0, cacheWrite: 0, output: 0 };
}
