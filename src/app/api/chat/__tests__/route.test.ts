// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { chat } from '@/content/chat';
import {
  chatLimiters,
  handleChatRequest,
  type ChatDeps,
  type ModelEvent,
} from '@/lib/chat/handle-chat';
import { mockDelay } from '@/lib/chat/mock';
import { BOXES, CHOCOLATES, STORE, readNdjson } from '@/lib/chat/__tests__/fixtures';
import { POST } from '../route';
import { GET as getStatus } from '../status/route';

const msgs = (text = 'Gợi ý hộp quà tặng sinh nhật') => ({
  messages: [{ role: 'user', content: text }],
});

const post = (
  body: unknown,
  init: { ip?: string; headers?: Record<string, string>; handler?: typeof POST } = {},
) =>
  (init.handler ?? POST)(
    new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'http://localhost',
        'x-forwarded-for': init.ip ?? '9.9.9.9',
        ...init.headers,
      },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
  );

beforeEach(() => {
  chatLimiters.burst.reset();
  chatLimiters.daily.reset();
  mockDelay.ms = 0;
  for (const k of ['ANTHROPIC_API_KEY', 'VERCEL', 'CHAT_ENABLED', 'CHAT_MODEL']) vi.stubEnv(k, '');
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

/** Gọi handler với mô hình giả. */
const fake = (events: ModelEvent[] | (() => AsyncGenerator<ModelEvent>)) => {
  const seen: { model?: string; systemPrompt?: string; context?: string | null; n?: number } = {};
  const deps: ChatDeps = {
    limiters: chatLimiters,
    getData: async () => ({ chocolates: CHOCOLATES, boxes: BOXES, store: STORE }),
    runModel: (args) => {
      seen.model = args.model;
      seen.systemPrompt = args.systemPrompt;
      seen.context = args.context;
      seen.n = args.messages.length;
      if (typeof events === 'function') return events();
      return (async function* () {
        for (const e of events) yield e;
      })();
    },
  };
  const call = (body: unknown) =>
    handleChatRequest(
      new Request('http://localhost/api/chat', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          origin: 'http://localhost',
          'x-forwarded-for': '1.1.1.1',
        },
        body: JSON.stringify(body),
      }),
      deps,
    );
  return { call, seen };
};

describe('POST /api/chat: kiểm tra đầu vào', () => {
  it('thân hợp lệ → 200 NDJSON', async () => {
    const res = await post(msgs());
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/x-ndjson');
  });

  it.each([
    ['không có tin nhắn', { messages: [] }],
    [
      'tin cuối là của trợ lý',
      {
        messages: [
          { role: 'user', content: 'a' },
          { role: 'assistant', content: 'b' },
        ],
      },
    ],
    ['tin người dùng > 600 ký tự', msgs('x'.repeat(601))],
    [
      'tin trợ lý > 2000 ký tự',
      {
        messages: [
          { role: 'assistant', content: 'y'.repeat(2001) },
          { role: 'user', content: 'a' },
        ],
      },
    ],
    [
      '> 16 tin',
      {
        messages: Array.from({ length: 17 }, (_, i) => ({
          role: i % 2 ? 'assistant' : 'user',
          content: 'a',
        })),
      },
    ],
    ['role lạ', { messages: [{ role: 'system', content: 'a' }] }],
    ['nội dung rỗng', msgs('   ')],
  ])('%s → 400', async (_name, body) => {
    const res = await post(body);
    expect(res.status).toBe(400);
    expect(((await res.json()) as { error: string }).error).toBe(chat.errors.invalidData);
  });

  it('đúng 600 ký tự và đúng 16 tin vẫn qua', async () => {
    expect((await post(msgs('x'.repeat(600)))).status).toBe(200);
    const sixteen = Array.from({ length: 16 }, (_, i) => ({
      role: i % 2 ? 'assistant' : 'user',
      content: 'a',
    }));
    sixteen[15] = { role: 'user', content: 'a' };
    expect((await post({ messages: sixteen })).status).toBe(200);
  });

  it('JSON hỏng → 400; sai content-type → 415; thân quá lớn → 413', async () => {
    expect((await post('{oops')).status).toBe(400);
    expect((await post(msgs(), { headers: { 'content-type': 'text/plain' } })).status).toBe(415);
    expect((await post('x'.repeat(200 * 1024))).status).toBe(413);
  });
});

describe('POST /api/chat: cùng nguồn gốc', () => {
  it('Origin khác host → 403', async () => {
    const res = await post(msgs(), { headers: { origin: 'https://evil.example' } });
    expect(res.status).toBe(403);
  });

  it('không có Origin lẫn Referer → 403', async () => {
    const req = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(msgs()),
    });
    expect((await POST(req)).status).toBe(403);
  });

  it('thiếu Origin nhưng Referer cùng host → qua', async () => {
    const req = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        referer: 'http://localhost/trang',
        'x-forwarded-for': '7.7.7.7',
      },
      body: JSON.stringify(msgs()),
    });
    expect((await POST(req)).status).toBe(200);
  });

  it('theo x-forwarded-host khi chạy sau proxy', async () => {
    const proxied = await post(msgs(), {
      headers: { origin: 'https://shop.example', 'x-forwarded-host': 'shop.example' },
    });
    expect(proxied.status).toBe(200);
  });
});

describe('POST /api/chat: công tắc & cấu hình', () => {
  it('CHAT_ENABLED=false → 503 tiếng Việt, và /status báo enabled=false', async () => {
    vi.stubEnv('CHAT_ENABLED', 'false');
    const res = await post(msgs());
    expect(res.status).toBe(503);
    expect(((await res.json()) as { error: string }).error).toBe(chat.errors.disabled);
    const st = (await (await getStatus()).json()) as { enabled: boolean };
    expect(st.enabled).toBe(false);
  });

  it('không có khoá: cục bộ → mock; trên Vercel → 503', async () => {
    const local = (await (await getStatus()).json()) as { enabled: boolean; mode: string };
    expect(local).toEqual({ enabled: true, mode: 'mock' });

    vi.stubEnv('VERCEL', '1');
    const res = await post(msgs());
    expect(res.status).toBe(503);
    expect(((await res.json()) as { error: string }).error).toBe(chat.errors.notConfigured);
    expect(((await (await getStatus()).json()) as { enabled: boolean }).enabled).toBe(false);
  });

  it('có khoá → mode live', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'sk-test');
    expect(await (await getStatus()).json()).toEqual({ enabled: true, mode: 'live' });
  });

  it('CHAT_MODEL ghi đè mô hình, mặc định claude-haiku-5-5', async () => {
    const a = fake([{ type: 'text', delta: 'ok' }]);
    await (await a.call(msgs())).text();
    expect(a.seen.model).toBe('claude-haiku-5-5');
    vi.stubEnv('CHAT_MODEL', 'claude-sonnet-5-5');
    const b = fake([{ type: 'text', delta: 'ok' }]);
    await (await b.call(msgs())).text();
    expect(b.seen.model).toBe('claude-sonnet-5-5');
  });
});

describe('POST /api/chat: giới hạn tần suất', () => {
  it('21 tin trong 10 phút → tin thứ 21 bị 429 kèm Retry-After; IP khác không ảnh hưởng', async () => {
    for (let i = 0; i < 20; i++) {
      const r = await post(msgs(`xin chào ${i}`));
      expect(r.status).toBe(200);
      await r.text();
    }
    const blocked = await post(msgs());
    expect(blocked.status).toBe(429);
    expect(Number(blocked.headers.get('retry-after'))).toBeGreaterThan(0);
    expect((await post(msgs(), { ip: '8.8.8.8' })).status).toBe(200);
  });

  it('giới hạn ngày 60 tin / IP (giới hạn 10 phút được nới để cô lập)', async () => {
    const { createRateLimiter } = await import('@/lib/order-server/rate-limit');
    const deps: ChatDeps = {
      limiters: {
        burst: createRateLimiter({ max: 1000, windowMs: 600_000 }),
        daily: createRateLimiter({ max: 60, windowMs: 86_400_000 }),
      },
      getData: async () => ({ chocolates: CHOCOLATES, boxes: BOXES, store: STORE }),
      runModel: async function* () {
        yield { type: 'text', delta: 'ok' };
      },
    };
    const call = () =>
      handleChatRequest(
        new Request('http://localhost/api/chat', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            origin: 'http://localhost',
            'x-forwarded-for': '3.3.3.3',
          },
          body: JSON.stringify(msgs()),
        }),
        deps,
      );
    for (let i = 0; i < 60; i++) {
      const r = await call();
      expect(r.status).toBe(200);
      await r.text();
    }
    expect((await call()).status).toBe(429);
  });
});

describe('POST /api/chat: luồng mock', () => {
  it('trả lời bằng nhiều mẩu text, một suggestion hợp lệ và done', async () => {
    const events = await readNdjson(await post(msgs()));
    const types = events.map((e) => e.type);
    expect(types.filter((t) => t === 'text').length).toBeGreaterThan(3);
    expect(types.filter((t) => t === 'suggestion')).toHaveLength(1);
    expect(types[types.length - 1]).toBe('done');
    const s = events.find((e) => e.type === 'suggestion')?.data as {
      size: number;
      pieces: string[];
      total: number;
      items: unknown[];
    };
    expect(s.pieces).toHaveLength(s.size);
    expect(s.total).toBeGreaterThan(0);
    expect(s.items.length).toBeGreaterThan(0);
  });

  it('"Viên nào ít ngọt?" → chỉ chữ, không gợi ý', async () => {
    const events = await readNdjson(await post(msgs('Viên nào ít ngọt?')));
    expect(events.some((e) => e.type === 'suggestion')).toBe(false);
    expect(events[events.length - 1]?.type).toBe('done');
  });
});

describe('POST /api/chat: xử lý đầu ra của mô hình', () => {
  const tool = (input: unknown): ModelEvent => ({ type: 'tool', name: 'suggest_box', input });

  it('gợi ý sai id/độ dài được sửa; giá tính lại ở server', async () => {
    const { call } = fake([
      { type: 'text', delta: 'Mình gợi ý:' },
      tool({ size: 6, pieces: ['01', 'zz', '03'], title: 'Hộp', reason: 'Hợp' }),
    ]);
    const events = await readNdjson(await call(msgs()));
    const s = events.find((e) => e.type === 'suggestion')?.data as {
      pieces: string[];
      total: number;
    };
    expect(s.pieces).toEqual(['01', '03', '01', '03', '01', '03']);
    expect(s.total).toBe(120000 + 35000 * 3 + 45000 * 3);
  });

  it('gợi ý không cứu được → bỏ, vẫn có text và done; không có gì cả → câu thay thế', async () => {
    const a = await readNdjson(
      await fake([{ type: 'text', delta: 'Xin chào' }, tool({ size: 99, pieces: ['01'] })]).call(
        msgs(),
      ),
    );
    expect(a.some((e) => e.type === 'suggestion')).toBe(false);
    expect(a[a.length - 1]?.type).toBe('done');

    const b = await readNdjson(await fake([tool({ size: 99, pieces: [] })]).call(msgs()));
    expect(b.find((e) => e.type === 'text')?.delta).toBe(chat.errors.badSuggestion);
  });

  it('chỉ nhận tool suggest_box, và chỉ một gợi ý mỗi lượt', async () => {
    const good = { size: 6, pieces: ['01', '02', '03', '04', '05', '06'], title: 'a', reason: 'b' };
    const events = await readNdjson(
      await fake([
        { type: 'tool', name: 'khac', input: good },
        tool(good),
        tool(good),
        { type: 'text', delta: '.' },
      ]).call(msgs()),
    );
    expect(events.filter((e) => e.type === 'suggestion')).toHaveLength(1);
  });

  it('lỗi giữa chừng → sự kiện error bằng tiếng Việt; 429 từ Anthropic → "đang bận"', async () => {
    const a = await readNdjson(
      await fake(async function* () {
        yield { type: 'text', delta: 'Xin' } as ModelEvent;
        throw Object.assign(new Error('boom'), { status: 500 });
      }).call(msgs()),
    );
    expect(a[a.length - 1]).toEqual({ type: 'error', message: chat.errors.failed });
    const b = await readNdjson(
      await fake(async function* () {
        yield* [] as ModelEvent[];
        throw Object.assign(new Error('rate'), { status: 429 });
      }).call(msgs()),
    );
    expect(b[b.length - 1]).toEqual({ type: 'error', message: chat.errors.busy });
  });

  it('ghi log token (input, cache read, output)', async () => {
    const log = vi.spyOn(console, 'log');
    await (
      await fake([
        { type: 'text', delta: 'a' },
        { type: 'usage', input: 12, cacheRead: 3400, cacheWrite: 0, output: 55 },
      ]).call(msgs())
    ).text();
    const line = log.mock.calls.map((c) => String(c[0])).find((l) => l.includes('[api/chat]'));
    expect(line).toContain('input=12');
    expect(line).toContain('cache_read=3400');
    expect(line).toContain('output=55');
  });

  it('boxContext được đưa vào khối ngữ cảnh riêng, không vào prompt cache', async () => {
    const f = fake([{ type: 'text', delta: 'a' }]);
    await (await f.call({ ...msgs(), boxContext: { size: 6, filledIds: ['01', '02'] } })).text();
    expect(f.seen.context).toContain('Chocolate 01');
    expect(f.seen.systemPrompt).not.toContain('đang xếp hộp');
  });
});
