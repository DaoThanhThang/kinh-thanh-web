import Anthropic from '@anthropic-ai/sdk';
import { chat as t } from '@/content/chat';
import { createRateLimiter, type RateLimiter } from '@/lib/order-server/rate-limit';
import { clientIp, readBodyLimited } from '@/lib/order-server/handle-order';
import type { BoxOption } from '@/lib/schemas/box';
import type { Chocolate } from '@/lib/schemas/chocolate';
import type { StoreInfo } from '@/lib/schemas/store-info';
import { getBoxOptions, getChocolates } from '@/lib/services/catalog';
import { getStoreInfo } from '@/lib/services/store-info';
import { mockModel } from './mock';
import { CHAT_BODY_MAX_BYTES, chatRequestSchema } from './schema';
import { resolveSuggestion } from './suggestion';
import { buildBoxContext, buildSystemPrompt } from './system-prompt';
import type { ChatEvent, ChatStatus } from './types';

export const DEFAULT_MODEL = 'claude-haiku-5-5';
/** Gồm cả token suy nghĩ (effort thấp nên ít), đủ cho 2–5 câu + lệnh gọi công cụ. */
export const MAX_TOKENS = 600;

/** 20 tin / 10 phút và 60 tin / ngày / IP, bộ nhớ tiến trình (xem rate-limit.ts về giới hạn serverless). */
export const chatLimiters = {
  burst: createRateLimiter({ max: 20, windowMs: 10 * 60 * 1000 }),
  daily: createRateLimiter({ max: 60, windowMs: 24 * 60 * 60 * 1000 }),
};

export const SUGGEST_TOOL: Anthropic.Tool = {
  name: 'suggest_box',
  description:
    'Đề xuất một hộp quà cụ thể cho khách. Giao diện sẽ hiển thị thẻ gợi ý kèm nút xếp hộp. Chỉ dùng id viên còn hàng trong danh mục.',
  input_schema: {
    type: 'object',
    properties: {
      size: { type: 'integer', enum: [6, 9, 12, 16], description: 'Số viên của hộp.' },
      pieces: {
        type: 'array',
        items: { type: 'string' },
        description: 'id các viên theo thứ tự ô, đúng bằng size phần tử (được lặp id).',
      },
      title: { type: 'string', maxLength: 60, description: 'Tên gợi ý ngắn.' },
      reason: { type: 'string', maxLength: 200, description: 'Vì sao hộp này hợp với khách.' },
    },
    required: ['size', 'pieces', 'title', 'reason'],
  },
};

/** Sự kiện từ mô hình (đã bóc khỏi SDK để test và mock dùng chung). */
export type ModelEvent =
  | { type: 'text'; delta: string }
  | { type: 'tool'; name: string; input: unknown }
  | {
      type: 'usage';
      input: number;
      cacheRead: number;
      cacheWrite: number;
      output: number;
    };

export type ModelArgs = {
  model: string;
  systemPrompt: string;
  context: string | null;
  messages: { role: 'user' | 'assistant'; content: string }[];
  signal: AbortSignal;
  /** Dữ liệu cho mock. */
  catalog: { chocolates: Chocolate[]; boxes: BoxOption[] };
};

export type ChatDeps = {
  limiters: { burst: RateLimiter; daily: RateLimiter };
  getData: () => Promise<{ chocolates: Chocolate[]; boxes: BoxOption[]; store: StoreInfo }>;
  /** Mặc định: Anthropic khi có khoá, mock khi không. Test thay thế được. */
  runModel?: (args: ModelArgs) => AsyncIterable<ModelEvent>;
};

export const defaultChatDeps: ChatDeps = {
  limiters: chatLimiters,
  getData: async () => {
    const [chocolates, boxes, store] = await Promise.all([
      getChocolates(),
      getBoxOptions(),
      getStoreInfo(),
    ]);
    return { chocolates, boxes, store };
  },
};

export function chatStatus(): ChatStatus & { reason?: 'disabled' | 'not-configured' } {
  if (process.env.CHAT_ENABLED === 'false')
    return { enabled: false, mode: 'live', reason: 'disabled' };
  if (process.env.ANTHROPIC_API_KEY) return { enabled: true, mode: 'live' };
  // Không có khoá: chạy mock khi phát triển cục bộ; trên Vercel thì tắt hẳn.
  if (process.env.VERCEL) return { enabled: false, mode: 'live', reason: 'not-configured' };
  return { enabled: true, mode: 'mock' };
}

const errorJson = (message: string, status: number, headers?: HeadersInit) =>
  Response.json(
    { ok: false, error: message },
    { status, headers: { 'Cache-Control': 'no-store', ...headers } },
  );

/** Cùng nguồn gốc: Origin (hoặc Referer khi thiếu Origin) phải trùng host của yêu cầu. */
export function isSameOrigin(req: Request): boolean {
  const host = (
    req.headers.get('x-forwarded-host') ??
    req.headers.get('host') ??
    new URL(req.url).host
  )
    .split(',')[0]
    ?.trim();
  const source = req.headers.get('origin') ?? req.headers.get('referer');
  if (!source || !host) return false;
  try {
    return new URL(source).host === host;
  } catch {
    return false;
  }
}

let cachedClient: Anthropic | null = null;
function getClient(): Anthropic {
  cachedClient ??= new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    maxRetries: 1,
    timeout: 25_000,
  });
  return cachedClient;
}

/** Gọi Anthropic (một lượt, stream). Lượt kết thúc ngay sau lệnh gọi suggest_box: thẻ gợi ý là phần hiển thị cuối. */
async function* anthropicModel(args: ModelArgs): AsyncGenerator<ModelEvent> {
  const system: Anthropic.TextBlockParam[] = [
    { type: 'text', text: args.systemPrompt, cache_control: { type: 'ephemeral' } },
  ];
  if (args.context) system.push({ type: 'text', text: args.context });

  const stream = getClient().messages.stream(
    {
      model: args.model,
      max_tokens: MAX_TOKENS,
      system,
      messages: args.messages,
      tools: [SUGGEST_TOOL],
      // Suy nghĩ thích ứng bật mặc định; effort thấp nhất cho trả lời nhanh. Không gửi temperature/top_p/top_k.
      output_config: { effort: 'low' },
    },
    { signal: args.signal },
  );

  for await (const ev of stream) {
    if (ev.type === 'content_block_delta' && ev.delta.type === 'text_delta') {
      yield { type: 'text', delta: ev.delta.text };
    }
  }
  const final = await stream.finalMessage();
  for (const block of final.content) {
    if (block.type === 'tool_use') yield { type: 'tool', name: block.name, input: block.input };
  }
  const u = final.usage;
  yield {
    type: 'usage',
    input: u.input_tokens,
    cacheRead: u.cache_read_input_tokens ?? 0,
    cacheWrite: u.cache_creation_input_tokens ?? 0,
    output: u.output_tokens,
  };
}

function apiErrorMessage(err: unknown): string {
  const status = (err as { status?: number } | null)?.status;
  if (status === 429 || status === 529 || status === 503) return t.errors.busy;
  return t.errors.failed;
}

export async function handleChatRequest(
  req: Request,
  deps: ChatDeps = defaultChatDeps,
): Promise<Response> {
  const e = t.errors;
  const status = chatStatus();
  if (!status.enabled) {
    return errorJson(status.reason === 'disabled' ? e.disabled : e.notConfigured, 503);
  }

  if (!isSameOrigin(req)) return errorJson(e.forbidden, 403);

  const ip = clientIp(req);
  const burst = deps.limiters.burst.check(ip);
  const daily = burst.allowed ? deps.limiters.daily.check(ip) : burst;
  if (!burst.allowed || !daily.allowed) {
    const wait = Math.max(burst.retryAfterSec, daily.retryAfterSec);
    return errorJson(e.tooManyRequests, 429, { 'Retry-After': String(wait) });
  }

  if (!(req.headers.get('content-type') ?? '').toLowerCase().includes('application/json')) {
    return errorJson(e.unsupportedType, 415);
  }
  const text = await readBodyLimited(req, CHAT_BODY_MAX_BYTES);
  if (text === null) return errorJson(e.tooLarge, 413);
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return errorJson(e.invalidJson, 400);
  }
  const parsed = chatRequestSchema.safeParse(raw);
  if (!parsed.success) return errorJson(e.invalidData, 400);
  const { messages, boxContext } = parsed.data;

  const data = await deps.getData();
  const model = process.env.CHAT_MODEL?.trim() || DEFAULT_MODEL;
  const runModel = deps.runModel ?? (status.mode === 'mock' ? mockModel : anthropicModel);
  const args: ModelArgs = {
    model,
    systemPrompt: buildSystemPrompt(data),
    context: buildBoxContext(boxContext, data.chocolates),
    messages,
    signal: req.signal,
    catalog: { chocolates: data.chocolates, boxes: data.boxes },
  };

  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const send = (event: ChatEvent) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        } catch {
          closed = true;
        }
      };
      let emittedText = false;
      let suggested = false;
      try {
        for await (const ev of runModel(args)) {
          if (ev.type === 'text') {
            if (ev.delta) emittedText = true;
            send({ type: 'text', delta: ev.delta });
          } else if (ev.type === 'tool') {
            if (ev.name !== 'suggest_box' || suggested) continue;
            const suggestion = resolveSuggestion(ev.input, data.chocolates, data.boxes);
            if (suggestion) {
              suggested = true;
              send({ type: 'suggestion', data: suggestion });
            } else {
              console.warn('[api/chat] bỏ gợi ý không hợp lệ từ mô hình');
            }
          } else if (ev.type === 'usage') {
            console.log(
              `[api/chat] model=${model} input=${ev.input} cache_read=${ev.cacheRead} cache_write=${ev.cacheWrite} output=${ev.output}`,
            );
          }
        }
        if (!emittedText && !suggested) {
          send({ type: 'text', delta: e.badSuggestion });
        }
        send({ type: 'done' });
      } catch (err) {
        if (!req.signal.aborted) {
          console.error('[api/chat] lỗi khi gọi mô hình', err);
          send({ type: 'error', message: apiErrorMessage(err) });
        }
      } finally {
        closed = true;
        try {
          controller.close();
        } catch {
          /* đã đóng */
        }
      }
    },
  });

  return new Response(body, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-store, no-transform',
      'X-Accel-Buffering': 'no',
    },
  });
}
