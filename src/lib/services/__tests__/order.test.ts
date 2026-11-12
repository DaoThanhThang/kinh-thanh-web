import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OrderPayload } from '@/lib/schemas/order';
import {
  ApiOrderService,
  AppsScriptOrderService,
  MockOrderService,
  createOrderService,
  generateOrderId,
} from '../order';

const payload: OrderPayload = {
  version: 1,
  createdAt: '2026-11-11T08:00:00.000Z',
  customer: {
    name: 'An',
    phone: '0912345678',
    email: 'an@example.com',
    address: '12 Phố Huế',
    province: 'Hà Nội',
    payment: 'cod',
  },
  box: {
    size: 6,
    slots: ['01'],
    items: [{ id: '01', name: 'Chocolate 01', qty: 1, unitPrice: 35000 }],
  },
  card: { message: 'hi', from: 'A', to: 'B' },
  pricing: { box: 120000, pieces: 35000, total: 155000 },
};

describe('generateOrderId', () => {
  it('KT-yyyymmdd-NNNN theo giờ địa phương', () => {
    const id = generateOrderId(new Date(2026, 10, 1), () => 0.0482);
    expect(id).toBe('KT-20261101-0482');
  });
  it('đệm số 0 và không vượt 4 chữ số', () => {
    expect(generateOrderId(new Date(2026, 0, 5), () => 0)).toBe('KT-20260105-0000');
    expect(generateOrderId(new Date(2026, 0, 5), () => 0.99999)).toBe('KT-20260105-9999');
  });
});

describe('MockOrderService', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('chờ 900ms, chỉ ghi ra log, trả orderId', async () => {
    const log = vi.fn();
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const svc = new MockOrderService({ log, now: () => new Date(2026, 10, 11), random: () => 0.5 });
    const done = vi.fn();
    const p = svc.submitOrder(payload).then(done);
    await vi.advanceTimersByTimeAsync(899);
    expect(done).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    await p;
    expect(done).toHaveBeenCalledWith({ ok: true, orderId: 'KT-20261111-5000' });
    expect(log).toHaveBeenCalledTimes(1);
    expect(log.mock.calls[0]?.[1]).toBe(payload);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});

describe('AppsScriptOrderService', () => {
  it('POST JSON dạng text/plain (không preflight) và trả orderId', async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json({ ok: true, orderId: 'KT-20261111-1234' }),
    ) as unknown as typeof fetch;
    const svc = new AppsScriptOrderService('https://script.example/exec', fetchImpl);
    const r = await svc.submitOrder(payload);
    expect(r).toEqual({ ok: true, orderId: 'KT-20261111-1234' });
    const [url, init] = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toBe('https://script.example/exec');
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>)['Content-Type']).toMatch(/^text\/plain/);
    expect(JSON.parse(init.body as string)).toEqual(payload);
  });

  it('phản hồi lỗi / mạng lỗi → ok:false', async () => {
    const bad = new AppsScriptOrderService('https://x', (async () =>
      Response.json({ ok: false, error: 'Hết hàng' })) as unknown as typeof fetch);
    expect(await bad.submitOrder(payload)).toEqual({ ok: false, error: 'Hết hàng' });
    const http = new AppsScriptOrderService(
      'https://x',
      (async () => new Response('x', { status: 500 })) as unknown as typeof fetch,
    );
    expect(await http.submitOrder(payload)).toEqual({ ok: false, error: 'HTTP 500' });
    const down = new AppsScriptOrderService('https://x', (async () => {
      throw new Error('offline');
    }) as unknown as typeof fetch);
    expect(await down.submitOrder(payload)).toEqual({ ok: false, error: 'offline' });
  });
});

describe('createOrderService', () => {
  it('không có endpoint → /api/order; "mock" → mock; URL → Apps Script', () => {
    expect(createOrderService(undefined)).toBeInstanceOf(ApiOrderService);
    expect(createOrderService('')).toBeInstanceOf(ApiOrderService);
    expect(createOrderService('   ')).toBeInstanceOf(ApiOrderService);
    expect(createOrderService('mock')).toBeInstanceOf(MockOrderService);
    expect(createOrderService('https://script.example/exec')).toBeInstanceOf(
      AppsScriptOrderService,
    );
  });
});

describe('ApiOrderService', () => {
  const respond = (body: unknown, status = 200) =>
    vi.fn(async () => new Response(JSON.stringify(body), { status }));

  it('POST JSON tới /api/order, không gửi giá, trả mã đơn của server', async () => {
    const fetchImpl = respond({ ok: true, orderId: 'KT-20261111-0001' });
    const res = await new ApiOrderService('/api/order', fetchImpl).submitOrder(payload);
    expect(res).toEqual({ ok: true, orderId: 'KT-20261111-0001' });
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('/api/order');
    expect(init.method).toBe('POST');
    const sent = JSON.parse(String(init.body));
    expect(sent).toMatchObject({
      customer: { name: 'An', phone: '0912345678', email: 'an@example.com' },
      delivery: { address: '12 Phố Huế', province: 'Hà Nội' },
      payment: 'cod',
      box: { size: 6, slots: ['01'] },
      message: 'hi',
      website: '',
    });
    expect(JSON.stringify(sent)).not.toContain('pricing');
    expect(JSON.stringify(sent)).not.toContain('unitPrice');
  });

  it('lỗi từ server → thông báo của server; lỗi mạng → thông báo kết nối', async () => {
    const bad = respond({ ok: false, error: 'Hộp chưa đầy.' }, 400);
    expect(await new ApiOrderService('/api/order', bad).submitOrder(payload)).toEqual({
      ok: false,
      error: 'Hộp chưa đầy.',
    });
    const down = vi.fn(async () => {
      throw new TypeError('Failed to fetch');
    });
    const res = await new ApiOrderService('/api/order', down).submitOrder(payload);
    expect(res.ok).toBe(false);
    const html = vi.fn(async () => new Response('<html>502</html>', { status: 502 }));
    expect((await new ApiOrderService('/api/order', html).submitOrder(payload)).ok).toBe(false);
  });
});
