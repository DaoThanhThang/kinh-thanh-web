import { describe, expect, it } from 'vitest';
import { parseOrderRequest } from '@/lib/schemas/order';
import { buildOrderRecord } from '../build-order';
import { generateServerOrderId } from '../order-id';
import { createRateLimiter } from '../rate-limit';
import { BOXES, CHOCOLATES, SLOTS_12, validRequest } from './fixtures';

describe('generateServerOrderId', () => {
  it('dùng ngày Asia/Ho_Chi_Minh, không phải UTC', () => {
    // 18:30 UTC ngày 11 = 01:30 ngày 12 ở Việt Nam.
    expect(generateServerOrderId(new Date('2026-11-11T18:30:00Z'), () => 482)).toBe(
      'KT-20261112-0482',
    );
    expect(generateServerOrderId(new Date('2026-11-11T16:59:00Z'), () => 7)).toBe(
      'KT-20261111-0007',
    );
  });
  it('mặc định ngẫu nhiên đúng dạng', () => {
    expect(generateServerOrderId()).toMatch(/^KT-\d{8}-\d{4}$/);
  });
});

describe('createRateLimiter', () => {
  it('chặn sau max lần trong cửa sổ, mở lại khi hết cửa sổ, tách theo khoá', () => {
    let t = 0;
    const rl = createRateLimiter({ max: 2, windowMs: 1000, now: () => t });
    expect(rl.check('a').allowed).toBe(true);
    expect(rl.check('a').allowed).toBe(true);
    const blocked = rl.check('a');
    expect(blocked).toEqual({ allowed: false, retryAfterSec: 1 });
    expect(rl.check('b').allowed).toBe(true);
    t = 1001;
    expect(rl.check('a').allowed).toBe(true);
  });
  it('giới hạn số khoá lưu', () => {
    const rl = createRateLimiter({ max: 1, windowMs: 10_000, maxKeys: 3 });
    for (let i = 0; i < 10; i++) rl.check(`ip${i}`);
    expect(rl.check('ip9').allowed).toBe(false);
    expect(rl.check('ip0').allowed).toBe(true); // khoá cũ đã bị loại
  });
});

describe('parseOrderRequest', () => {
  it('hợp lệ → chuẩn hoá điện thoại, trim', () => {
    const r = parseOrderRequest(validRequest(), new Date('2026-11-12'));
    expect(r.ok && r.data.customer.phone).toBe('0912345678');
  });
  it('dùng chung lỗi tiếng Việt của form', () => {
    const r = parseOrderRequest(validRequest({ customer: { name: '', phone: '123' } }));
    expect(r).toEqual({ ok: false, error: 'Hãy nhập họ tên người đặt.' });
    expect(parseOrderRequest(validRequest({ payment: 'bitcoin' })).ok).toBe(false);
    expect(parseOrderRequest({ foo: 1 }).ok).toBe(false);
  });
  it('lời nhắn > 150 ký tự bị từ chối (đếm theo code point)', () => {
    expect(parseOrderRequest(validRequest({ message: 'a'.repeat(150) })).ok).toBe(true);
    expect(parseOrderRequest(validRequest({ message: 'a'.repeat(151) })).ok).toBe(false);
    expect(parseOrderRequest(validRequest({ message: '🍫'.repeat(150) })).ok).toBe(true);
  });
});

describe('buildOrderRecord', () => {
  const build = (slots: (string | null)[], size = 12) => {
    const parsed = parseOrderRequest(
      validRequest({ box: { size, slots } }),
      new Date('2026-11-12'),
    );
    if (!parsed.ok) throw new Error(parsed.error);
    return buildOrderRecord({
      request: parsed.data,
      chocolates: CHOCOLATES,
      boxes: BOXES,
      orderId: 'KT-1',
      now: new Date(),
    });
  };

  it('tính giá từ catalog, gom viên theo sortOrder', () => {
    const r = build(SLOTS_12);
    if (!r.ok) throw new Error(r.error);
    expect(r.order.pricing).toEqual({ box: 180000, pieces: 685000, total: 865000 });
    expect(r.order.lines.map((l) => l.id)).toEqual([
      '01',
      '02',
      '03',
      '04',
      '05',
      '07',
      '09',
      '11',
    ]);
    expect(r.order.cells[0]).toMatchObject({ n: 1, id: '03', name: 'Chocolate 03' });
  });
  it('từ chối: ô trống, sai độ dài, id lạ, viên hết hàng, cỡ lạ', () => {
    expect(build([...SLOTS_12.slice(0, 11), null]).ok).toBe(false);
    expect(build(SLOTS_12.slice(0, 11)).ok).toBe(false);
    expect(build([...SLOTS_12.slice(0, 11), '99'])).toMatchObject({
      ok: false,
      error: expect.stringContaining('99'),
    });
    expect(build([...SLOTS_12.slice(0, 11), '12'])).toMatchObject({
      ok: false,
      error: expect.stringContaining('Chocolate 12'),
    });
    expect(build(['01', '02', '03'], 3).ok).toBe(false);
  });
});
