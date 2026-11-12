// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { chatLimiters, handleChatRequest, type ChatDeps } from '../handle-chat';
import { BOXES, CHOCOLATES, STORE, readNdjson } from './fixtures';

const sse = (events: [string, unknown][]) =>
  events.map(([name, data]) => `event: ${name}\ndata: ${JSON.stringify(data)}\n\n`).join('');

const message = [
  [
    'message_start',
    {
      type: 'message_start',
      message: {
        id: 'msg_1',
        type: 'message',
        role: 'assistant',
        model: 'claude-haiku-5-5',
        content: [],
        stop_reason: null,
        stop_sequence: null,
        usage: {
          input_tokens: 40,
          cache_read_input_tokens: 3000,
          cache_creation_input_tokens: 0,
          output_tokens: 1,
        },
      },
    },
  ],
  [
    'content_block_start',
    { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } },
  ],
  [
    'content_block_delta',
    { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'Mình gợi ý ' } },
  ],
  [
    'content_block_delta',
    { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'hộp này.' } },
  ],
  ['content_block_stop', { type: 'content_block_stop', index: 0 }],
  [
    'content_block_start',
    {
      type: 'content_block_start',
      index: 1,
      content_block: { type: 'tool_use', id: 'toolu_1', name: 'suggest_box', input: {} },
    },
  ],
  [
    'content_block_delta',
    {
      type: 'content_block_delta',
      index: 1,
      delta: {
        type: 'input_json_delta',
        partial_json: '{"size":6,"pieces":["01","02","03","04","05","06"],',
      },
    },
  ],
  [
    'content_block_delta',
    {
      type: 'content_block_delta',
      index: 1,
      delta: { type: 'input_json_delta', partial_json: '"title":"Hộp thử","reason":"Hợp."}' },
    },
  ],
  ['content_block_stop', { type: 'content_block_stop', index: 1 }],
  [
    'message_delta',
    {
      type: 'message_delta',
      delta: { stop_reason: 'tool_use', stop_sequence: null },
      usage: { output_tokens: 77 },
    },
  ],
  ['message_stop', { type: 'message_stop' }],
] as [string, unknown][];

describe('gọi Anthropic (SDK, fetch giả)', () => {
  const requests: { url: string; body: Record<string, unknown> }[] = [];
  beforeEach(() => {
    requests.length = 0;
    chatLimiters.burst.reset();
    chatLimiters.daily.reset();
    vi.stubEnv('ANTHROPIC_API_KEY', 'sk-ant-test');
    vi.stubEnv('CHAT_MODEL', '');
    vi.stubEnv('VERCEL', '');
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
        requests.push({ url: String(url), body: JSON.parse(String(init?.body)) });
        return new Response(sse(message), {
          status: 200,
          headers: { 'content-type': 'text/event-stream' },
        });
      }),
    );
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('gửi đúng hình dạng yêu cầu và chuyển stream thành text + suggestion + done', async () => {
    const deps: ChatDeps = {
      limiters: chatLimiters,
      getData: async () => ({ chocolates: CHOCOLATES, boxes: BOXES, store: STORE }),
    };
    const res = await handleChatRequest(
      new Request('http://localhost/api/chat', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          origin: 'http://localhost',
          'x-forwarded-for': '5.5.5.5',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Gợi ý hộp quà' }],
          boxContext: { size: 6, filledIds: ['01'] },
        }),
      }),
      deps,
    );
    const events = await readNdjson(res);
    expect(
      events
        .filter((e) => e.type === 'text')
        .map((e) => e.delta)
        .join(''),
    ).toBe('Mình gợi ý hộp này.');
    const s = events.find((e) => e.type === 'suggestion')?.data as {
      pieces: string[];
      total: number;
    };
    expect(s.pieces).toEqual(['01', '02', '03', '04', '05', '06']);
    expect(s.total).toBe(405000);
    expect(events[events.length - 1]).toEqual({ type: 'done' });

    expect(requests).toHaveLength(1);
    const body = requests[0]!.body as {
      model: string;
      max_tokens: number;
      stream: boolean;
      system: { text: string; cache_control?: { type: string } }[];
      tools: { name: string }[];
      output_config: { effort: string };
      messages: unknown[];
    };
    expect(requests[0]!.url).toContain('/v1/messages');
    expect(body.model).toBe('claude-haiku-5-5');
    expect(body.stream).toBe(true);
    expect(body.max_tokens).toBeLessThanOrEqual(700);
    expect(body.output_config).toEqual({ effort: 'low' });
    expect(body.tools.map((t) => t.name)).toEqual(['suggest_box']);
    expect(body.system[0]?.cache_control).toEqual({ type: 'ephemeral' });
    expect(body.system[0]?.text).toContain('Danh mục chocolate');
    expect(body.system[1]?.cache_control).toBeUndefined();
    expect(body.system[1]?.text).toContain('Chocolate 01');
    for (const k of ['temperature', 'top_p', 'top_k']) expect(body).not.toHaveProperty(k);

    const log = vi
      .mocked(console.log)
      .mock.calls.map((c) => String(c[0]))
      .join('\n');
    expect(log).toContain('cache_read=3000');
    expect(log).toContain('output=77');
  });
});
