import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { chat } from '@/content/chat';
import { useBoxStore } from '@/features/box-builder';
import type { ChatEvent, ChatSuggestion } from '@/lib/chat/types';
import { ChatWidget } from '../ChatWidget';
import { CHAT_STORAGE_KEY } from '../storage';

/** Mô phỏng tối thiểu thao tác người dùng (không thêm thư viện user-event). */
const userEvent = {
  async click(el: Element) {
    await act(async () => {
      fireEvent.click(el);
    });
  },
  async type(el: Element, text: string) {
    const box = el as HTMLTextAreaElement;
    let shift = false;
    await act(async () => {
      for (const token of text.match(/\{[^}]+\}|[^{]/g) ?? []) {
        if (token === '{Shift>}') shift = true;
        else if (token === '{/Shift}') shift = false;
        else if (token === '{Enter}') {
          const proceed = fireEvent.keyDown(box, { key: 'Enter', shiftKey: shift });
          if (shift && proceed) fireEvent.change(box, { target: { value: `${box.value}\n` } });
        } else fireEvent.change(box, { target: { value: box.value + token } });
      }
    });
  },
  async keyboard(key: string) {
    const name = key.replace(/[{}]/g, '');
    await act(async () => {
      fireEvent.keyDown(document.activeElement ?? document.body, { key: name });
    });
  },
};

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

const suggestion: ChatSuggestion = {
  size: 6,
  cols: 3,
  rows: 2,
  pieces: ['01', '02', '03', '01', '02', '03'],
  items: [
    { id: '01', name: 'Chocolate 01', image: '/chocolates/01.svg', price: 35000 },
    { id: '02', name: 'Chocolate 02', image: '/chocolates/02.svg', price: 40000 },
    { id: '03', name: 'Chocolate 03', image: '/chocolates/03.svg', price: 45000 },
  ],
  title: 'Hộp quà sinh nhật',
  reason: 'Ba vị khác nhau.',
  boxPrice: 120000,
  total: 360000,
};

const enc = new TextEncoder();
const line = (e: ChatEvent) => `${JSON.stringify(e)}\n`;

type Reply = { status?: number; body?: string[] | object; hold?: Promise<void> };
let replies: Reply[] = [];
let calls: { url: string; body?: { messages: { role: string; content: string }[] } }[] = [];

function streamOf(chunks: string[], hold?: Promise<void>, signal?: AbortSignal | null): Response {
  const stream = new ReadableStream<Uint8Array>({
    async start(c) {
      signal?.addEventListener('abort', () => {
        try {
          c.error(new DOMException('aborted', 'AbortError'));
        } catch {
          /* đã đóng */
        }
      });
      for (const [i, chunk] of chunks.entries()) {
        if (i === 1 && hold) await hold;
        c.enqueue(enc.encode(chunk));
      }
      c.close();
    },
  });
  return new Response(stream, { headers: { 'content-type': 'application/x-ndjson' } });
}

function mockFetch(
  status: { enabled: boolean; mode: 'live' | 'mock' } = { enabled: true, mode: 'live' },
) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit) => {
      if (url === '/api/chat/status') return Response.json(status);
      calls.push({ url, body: init?.body ? JSON.parse(String(init.body)) : undefined });
      const r = replies.shift() ?? {
        body: [line({ type: 'text', delta: 'ok' }), line({ type: 'done' })],
      };
      if (r.status && r.status >= 400) return Response.json(r.body ?? {}, { status: r.status });
      return streamOf(r.body as string[], r.hold, init?.signal);
    }),
  );
}

async function openPanel() {
  render(<ChatWidget />);
  const launcher = await screen.findByRole('button', { name: chat.launcherLabel });
  await userEvent.click(launcher);
  const panel = await screen.findByRole('dialog', { name: chat.panelTitle });
  return { launcher, panel };
}

beforeEach(() => {
  replies = [];
  calls = [];
  push.mockClear();
  window.sessionStorage.clear();
  window.localStorage.clear();
  useBoxStore.setState({ size: null, slots: [], message: '', from: '', to: '' });
  vi.stubGlobal('requestIdleCallback', (cb: () => void) => window.setTimeout(cb, 0));
  vi.stubGlobal('cancelIdleCallback', (id: number) => window.clearTimeout(id));
  mockFetch();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  document.documentElement.removeAttribute('style');
});

describe('ChatWidget: nút nổi và khung', () => {
  it('trợ lý tắt → không có nút', async () => {
    mockFetch({ enabled: false, mode: 'live' });
    render(<ChatWidget />);
    await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/chat/status', expect.anything()));
    await act(async () => {});
    expect(screen.queryByRole('button', { name: chat.launcherLabel })).toBeNull();
  });

  it('mở/đóng: aria-expanded, lời chào, 3 gợi ý nhanh, Esc đóng và trả focus', async () => {
    render(<ChatWidget />);
    const launcher = await screen.findByRole('button', { name: chat.launcherLabel });
    expect(launcher).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('dialog')).toBeNull(); // mã khung chưa tải

    await userEvent.click(launcher);
    const panel = await screen.findByRole('dialog', { name: chat.panelTitle });
    expect(launcher).toHaveAttribute('aria-expanded', 'true');
    expect(within(panel).getByText(chat.greeting)).toBeInTheDocument();
    for (const q of chat.quickReplies) {
      expect(within(panel).getByRole('button', { name: q })).toBeInTheDocument();
    }
    expect(within(panel).getByText(chat.footnote, { exact: false })).toBeInTheDocument();

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(launcher).toHaveAttribute('aria-expanded', 'false');
    expect(launcher).toHaveFocus();
  });

  it('nút Đóng trong khung đóng khung', async () => {
    const { panel } = await openPanel();
    await userEvent.click(within(panel).getByRole('button', { name: chat.closeLabel }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('báo độ rộng nút nổi để nút tiếng của hero dịch sang', async () => {
    await openPanel();
    expect(document.documentElement.style.getPropertyValue('--chat-launcher-shift')).toMatch(/px$/);
  });
});

describe('ChatWidget: gửi tin và stream', () => {
  it('gợi ý nhanh gửi đúng nội dung và ẩn danh sách gợi ý', async () => {
    const { panel } = await openPanel();
    await userEvent.click(within(panel).getByRole('button', { name: chat.quickReplies[0] }));
    await waitFor(() => expect(calls).toHaveLength(1));
    expect(calls[0]?.url).toBe('/api/chat');
    expect(calls[0]?.body?.messages).toEqual([{ role: 'user', content: chat.quickReplies[0] }]);
    expect(within(panel).queryByRole('group', { name: chat.quickRepliesLabel })).toBeNull();
  });

  it('hiện chữ dần khi stream (dòng NDJSON bị cắt giữa chừng), rồi báo aria-live khi xong', async () => {
    let release!: () => void;
    const hold = new Promise<void>((r) => (release = r));
    const a = line({ type: 'text', delta: 'Chào ' });
    const b = line({ type: 'text', delta: 'bạn nhé' });
    replies.push({ body: [a + b.slice(0, 10), b.slice(10) + line({ type: 'done' })], hold });
    const { panel } = await openPanel();
    const box = within(panel).getByRole('textbox', { name: chat.inputLabel });
    await userEvent.type(box, 'Xin chào{Enter}');

    // Mới có mẩu đầu: chưa có thông báo aria-live.
    await within(panel).findByText('Chào');
    expect(within(panel).getByRole('button', { name: chat.stop })).toBeInTheDocument();
    expect(within(panel).queryByText(chat.announceDone('Chào bạn nhé'))).toBeNull();

    release();
    await within(panel).findByText('Chào bạn nhé');
    await waitFor(() =>
      expect(within(panel).getByRole('button', { name: chat.send })).toBeInTheDocument(),
    );
    expect(within(panel).getByText(chat.announceDone('Chào bạn nhé'))).toBeInTheDocument();
  });

  it('Enter gửi; Shift+Enter xuống dòng; đang gõ dấu (IME) thì Enter không gửi; đếm ký tự', async () => {
    const { panel } = await openPanel();
    const box = within(panel).getByRole('textbox', {
      name: chat.inputLabel,
    }) as HTMLTextAreaElement;
    expect(within(panel).getByText('0/600')).toBeInTheDocument();

    await userEvent.type(box, 'một{Shift>}{Enter}{/Shift}hai');
    expect(box.value).toBe('một\nhai');
    expect(calls).toHaveLength(0);
    expect(within(panel).getByText('7/600')).toBeInTheDocument();

    fireEvent.keyDown(box, { key: 'Enter', isComposing: true });
    expect(calls).toHaveLength(0);

    await userEvent.type(box, '{Enter}');
    await waitFor(() => expect(calls).toHaveLength(1));
    expect(calls[0]?.body?.messages[0]?.content).toBe('một\nhai');
    await waitFor(() => expect(box.value).toBe(''));
    expect(box).toHaveAttribute('maxlength', '600');
  });

  it('lỗi từ server hiện thông báo tiếng Việt và "Thử lại" gửi lại đúng lịch sử', async () => {
    replies.push({ status: 503, body: { ok: false, error: chat.errors.disabled } });
    const { panel } = await openPanel();
    await userEvent.type(within(panel).getByRole('textbox'), 'hello{Enter}');
    expect(await within(panel).findByText(chat.errors.disabled)).toBeInTheDocument();

    replies.push({ body: [line({ type: 'text', delta: 'Đã ổn' }), line({ type: 'done' })] });
    await userEvent.click(within(panel).getByRole('button', { name: chat.retry }));
    expect(await within(panel).findByText('Đã ổn')).toBeInTheDocument();
    expect(calls).toHaveLength(2);
    expect(calls[1]?.body?.messages).toEqual([{ role: 'user', content: 'hello' }]);
    expect(within(panel).queryByText(chat.errors.disabled)).toBeNull();
  });

  it('lỗi mạng → thông báo kết nối', async () => {
    const { panel } = await openPanel();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.reject(new TypeError('network'))),
    );
    await userEvent.type(within(panel).getByRole('textbox'), 'hello{Enter}');
    expect(await within(panel).findByText(chat.errors.network)).toBeInTheDocument();
  });

  it('nút Dừng ngắt luồng và giữ phần chữ đã nhận', async () => {
    const never = new Promise<void>(() => {});
    replies.push({
      body: [line({ type: 'text', delta: 'Một nửa' }), line({ type: 'done' })],
      hold: never,
    });
    const { panel } = await openPanel();
    await userEvent.type(within(panel).getByRole('textbox'), 'hello{Enter}');
    await within(panel).findByText('Một nửa');
    await userEvent.click(within(panel).getByRole('button', { name: chat.stop }));
    await waitFor(() =>
      expect(within(panel).getByRole('button', { name: chat.send })).toBeInTheDocument(),
    );
    expect(within(panel).getByText('Một nửa')).toBeInTheDocument();
  });

  it('không chèn HTML thô: thẻ hiện thành chữ; **đậm** và danh sách được dựng an toàn', async () => {
    const evil =
      '<img src=x onerror="window.__pwned=1"> **đậm** <script>window.__pwned=2</script>\n- một\n- hai';
    replies.push({ body: [line({ type: 'text', delta: evil }), line({ type: 'done' })] });
    const { panel } = await openPanel();
    await userEvent.type(within(panel).getByRole('textbox'), '<b>x</b>{Enter}');
    await within(panel).findByText('đậm');
    expect(panel.querySelector('img[src="x"]')).toBeNull();
    expect(panel.querySelector('script')).toBeNull();
    expect(panel.querySelector('b')).toBeNull();
    expect(panel.querySelector('strong')?.textContent).toBe('đậm');
    expect(panel.querySelectorAll('li')).toHaveLength(2);
    expect(panel.textContent).toContain('<img src=x onerror="window.__pwned=1">');
    expect(panel.textContent).toContain('<b>x</b>'); // tin của người dùng cũng là chữ thuần
    expect((window as unknown as { __pwned?: number }).__pwned).toBeUndefined();
  });
});

describe('ChatWidget: sessionStorage', () => {
  it('cuộc trò chuyện được giữ khi dựng lại; "Bắt đầu lại" xoá', async () => {
    replies.push({ body: [line({ type: 'text', delta: 'Xin chào bạn' }), line({ type: 'done' })] });
    const first = await openPanel();
    await userEvent.type(within(first.panel).getByRole('textbox'), 'chào{Enter}');
    await within(first.panel).findByText('Xin chào bạn');
    await waitFor(() =>
      expect(window.sessionStorage.getItem(CHAT_STORAGE_KEY)).toContain('Xin chào bạn'),
    );
    cleanup();

    const second = await openPanel();
    expect(within(second.panel).getByText('Xin chào bạn')).toBeInTheDocument();
    expect(within(second.panel).getByText('chào')).toBeInTheDocument();

    await userEvent.click(within(second.panel).getByRole('button', { name: chat.restart }));
    expect(within(second.panel).queryByText('Xin chào bạn')).toBeNull();
    expect(window.sessionStorage.getItem(CHAT_STORAGE_KEY)).toBeNull();
    expect(
      within(second.panel).getByRole('button', { name: chat.quickReplies[1] }),
    ).toBeInTheDocument();
  });

  it('sessionStorage bị chặn hoặc hỏng không làm vỡ widget', async () => {
    window.sessionStorage.setItem(CHAT_STORAGE_KEY, '{không phải json');
    const { panel } = await openPanel();
    expect(within(panel).getByText(chat.greeting)).toBeInTheDocument();
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    await userEvent.type(within(panel).getByRole('textbox'), 'chào{Enter}');
    expect(await within(panel).findByText('ok')).toBeInTheDocument();
    spy.mockRestore();
  });

  it('lịch sử gửi lên có ghi chú về gợi ý đã hiển thị, bắt đầu bằng tin người dùng', async () => {
    replies.push({
      body: [
        line({ type: 'text', delta: 'Đây nhé' }),
        line({ type: 'suggestion', data: suggestion }),
        line({ type: 'done' }),
      ],
    });
    const { panel } = await openPanel();
    await userEvent.type(within(panel).getByRole('textbox'), 'một hộp{Enter}');
    await within(panel).findByText(suggestion.title);
    await userEvent.type(within(panel).getByRole('textbox'), 'thêm nữa{Enter}');
    await waitFor(() => expect(calls).toHaveLength(2));
    const msgs = calls[1]?.body?.messages ?? [];
    expect(msgs.map((m) => m.role)).toEqual(['user', 'assistant', 'user']);
    expect(msgs[1]?.content).toContain('Đã hiển thị gợi ý hộp');
  });
});

describe('ChatWidget: thẻ gợi ý', () => {
  const withSuggestion = async () => {
    replies.push({
      body: [
        line({ type: 'text', delta: 'Mình gợi ý:' }),
        line({ type: 'suggestion', data: suggestion }),
        line({ type: 'done' }),
      ],
    });
    const ctx = await openPanel();
    await userEvent.type(within(ctx.panel).getByRole('textbox'), 'gợi ý hộp{Enter}');
    await within(ctx.panel).findByRole('button', { name: chat.suggestion.apply });
    return ctx;
  };

  it('hiện tiêu đề, lưới ảnh, tổng tiền, lý do; "Xem từng viên" mở danh sách tên', async () => {
    const { panel } = await withSuggestion();
    expect(within(panel).getByText(suggestion.title)).toBeInTheDocument();
    expect(within(panel).getByText('360.000 ₫')).toBeInTheDocument();
    expect(within(panel).getByText(suggestion.reason)).toBeInTheDocument();
    const grid = within(panel).getByRole('img', {
      name: chat.suggestion.previewLabel(suggestion.title, 6),
    });
    expect(grid.querySelectorAll('img')).toHaveLength(6);
    expect(grid).toHaveStyle({ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' });

    const toggle = within(panel).getByRole('button', { name: chat.suggestion.showPieces });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(within(panel).getByRole('list', { name: chat.suggestion.piecesLabel })).toBeVisible();
  });

  it('hộp đang trống: xếp thẳng theo thứ tự ô và cuộn tới #builder', async () => {
    const { panel } = await withSuggestion();
    await userEvent.click(within(panel).getByRole('button', { name: chat.suggestion.apply }));
    await waitFor(() => expect(useBoxStore.getState().slots).toEqual(suggestion.pieces));
    expect(useBoxStore.getState().size).toBe(6);
    expect(within(panel).getByText(chat.suggestion.applied)).toBeInTheDocument();
    expect(screen.queryByText(chat.suggestion.confirmTitle)).toBeNull();
    await waitFor(() => expect(push).toHaveBeenCalledWith('/#builder'));
  });

  it('hộp đã có viên: hỏi xác nhận; giữ thì không đổi, thay thì thay toàn bộ (cả khi khác cỡ)', async () => {
    useBoxStore.setState({ size: 12, slots: ['05', ...Array<string | null>(11).fill(null)] });
    const { panel } = await withSuggestion();
    await userEvent.click(within(panel).getByRole('button', { name: chat.suggestion.apply }));
    const confirmTitle = await screen.findByText(chat.suggestion.confirmTitle);
    expect(screen.getByText(chat.suggestion.confirmBody(1))).toBeInTheDocument();
    expect(useBoxStore.getState().size).toBe(12);

    await userEvent.click(screen.getByRole('button', { name: chat.suggestion.confirmNo }));
    await waitFor(() => expect(confirmTitle).not.toBeVisible());
    expect(useBoxStore.getState().slots[0]).toBe('05');
    expect(useBoxStore.getState().size).toBe(12);

    await userEvent.click(within(panel).getByRole('button', { name: chat.suggestion.apply }));
    await screen.findByText(chat.suggestion.confirmTitle);
    await userEvent.click(screen.getByRole('button', { name: chat.suggestion.confirmYes }));
    await waitFor(() => expect(useBoxStore.getState().slots).toEqual(suggestion.pieces));
    expect(useBoxStore.getState().size).toBe(6);
  });

  it('gửi ngữ cảnh hộp đang xếp (kích cỡ + id) cho server', async () => {
    useBoxStore.setState({ size: 6, slots: ['02', null, '04', null, null, null] });
    const { panel } = await openPanel();
    await userEvent.type(within(panel).getByRole('textbox'), 'xin chào{Enter}');
    await waitFor(() => expect(calls).toHaveLength(1));
    expect((calls[0]?.body as { boxContext?: unknown }).boxContext).toEqual({
      size: 6,
      filledIds: ['02', '04'],
    });
  });
});
