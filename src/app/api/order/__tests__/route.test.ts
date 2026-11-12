// @vitest-environment node
import { existsSync, readdirSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { orderRateLimiter } from '@/lib/order-server/handle-order';
import { SLOTS_12, validRequest } from '@/lib/order-server/__tests__/fixtures';
import { POST } from '../route';

type Body = { ok: boolean; orderId?: string; error?: string };

const post = (body: unknown, init: { ip?: string; headers?: Record<string, string> } = {}) =>
  POST(
    new Request('http://localhost/api/order', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': init.ip ?? '1.2.3.4',
        ...init.headers,
      },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
  );

const call = async (body: unknown, init?: Parameters<typeof post>[1]) => {
  const res = await post(body, init);
  return { status: res.status, body: (await res.json()) as Body, res };
};

const previewDir = path.join(os.tmpdir(), 'kinh-thanh-mail');

beforeEach(() => {
  orderRateLimiter.reset();
  for (const k of ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'VERCEL']) vi.stubEnv(k, '');
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('POST /api/order', () => {
  it('đơn hợp lệ (xem trước, chưa có SMTP) → ok + mã KT-yyyymmdd-NNNN, ghi file xem trước', async () => {
    const { status, body } = await call(validRequest());
    expect(status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.orderId).toMatch(/^KT-\d{8}-\d{4}$/);
    expect(existsSync(path.join(previewDir, `${body.orderId}-khay.png`))).toBe(true);
    expect(existsSync(path.join(previewDir, `${body.orderId}-shop.html`))).toBe(true);
    for (const f of readdirSync(previewDir)) {
      if (f.includes(body.orderId ?? '#')) rmSync(path.join(previewDir, f));
    }
  });

  it('giá client gửi lên bị bỏ qua: email dùng giá tính lại từ catalog', async () => {
    const sent: unknown[] = [];
    vi.stubEnv('SMTP_HOST', 'h');
    vi.stubEnv('SMTP_USER', 'u@x.com');
    vi.stubEnv('SMTP_PASS', 'p');
    const nodemailer = await import('nodemailer');
    vi.spyOn(nodemailer.default, 'createTransport').mockReturnValue({
      sendMail: async (m: unknown) => void sent.push(m),
    } as never);
    const tampered = validRequest({
      pricing: { box: 1, pieces: 1, total: 1 },
      box: {
        size: 12,
        slots: SLOTS_12,
        items: [{ id: '01', name: 'Free', qty: 12, unitPrice: 1 }],
      },
    });
    const { status, body } = await call(tampered);
    expect(status).toBe(200);
    expect(body.ok).toBe(true);
    const shop = sent[0] as { html: string; subject: string };
    expect(shop.subject).toContain('715.000 ₫');
    expect(shop.html).toContain('715.000 ₫');
    expect(shop.html).not.toContain('Free');
  });

  it('hộp chưa đầy (ô null hoặc thiếu ô) → 400', async () => {
    const a = await call(
      validRequest({ box: { size: 12, slots: [...SLOTS_12.slice(0, 11), null] } }),
    );
    expect(a.status).toBe(400);
    expect(a.body).toMatchObject({ ok: false, error: expect.stringContaining('Hộp chưa đầy') });
    const b = await call(validRequest({ box: { size: 12, slots: SLOTS_12.slice(0, 10) } }));
    expect(b.status).toBe(400);
  });

  it('id viên không có trong catalog → 400', async () => {
    const { status, body } = await call(
      validRequest({ box: { size: 12, slots: [...SLOTS_12.slice(0, 11), '99'] } }),
    );
    expect(status).toBe(400);
    expect(body.error).toContain('99');
  });

  it('thông tin khách sai → 400 với thông báo tiếng Việt', async () => {
    const { status, body } = await call(validRequest({ customer: { name: 'An', phone: '12' } }));
    expect(status).toBe(400);
    expect(body.error).toMatch(/số điện thoại/i);
  });

  it('honeypot có chữ → trả ok nhưng không dựng ảnh, không gửi gì', async () => {
    const before = existsSync(previewDir) ? readdirSync(previewDir).length : 0;
    const { status, body } = await call(validRequest({ website: 'http://spam.example' }));
    expect(status).toBe(200);
    expect(body).toMatchObject({ ok: true, orderId: expect.stringMatching(/^KT-/) });
    const after = existsSync(previewDir) ? readdirSync(previewDir).length : 0;
    expect(after).toBe(before);
  });

  it('không phải JSON → 415 / 400; thân quá lớn → 413', async () => {
    const wrongType = await post('x=1', { headers: { 'content-type': 'text/plain' } });
    expect(wrongType.status).toBe(415);
    const broken = await call('{not json');
    expect(broken.status).toBe(400);
    expect(broken.body.ok).toBe(false);
    const big = await call(validRequest({ message: 'a'.repeat(40 * 1024) }));
    expect(big.status).toBe(413);
    const arr = await call('[1,2]');
    expect(arr.status).toBe(400);
  });

  it('giới hạn 5 đơn / 10 phút / IP → 429 kèm Retry-After; IP khác vẫn được', async () => {
    const ok = validRequest({ website: 'bot' }); // honeypot cho nhanh, vẫn tính vào giới hạn
    for (let i = 0; i < 5; i++) expect((await call(ok, { ip: '9.9.9.9' })).status).toBe(200);
    const blocked = await call(ok, { ip: '9.9.9.9' });
    expect(blocked.status).toBe(429);
    expect(blocked.body.ok).toBe(false);
    expect(Number(blocked.res.headers.get('retry-after'))).toBeGreaterThan(0);
    expect((await call(ok, { ip: '8.8.8.8' })).status).toBe(200);
  });

  it('gửi email shop lỗi → 500 ok:false (khách thử lại); trên Vercel thiếu SMTP cũng vậy', async () => {
    vi.stubEnv('VERCEL', '1');
    const { status, body } = await call(validRequest());
    expect(status).toBe(500);
    expect(body).toMatchObject({ ok: false, error: expect.stringContaining('gửi lại') });
  });
});
