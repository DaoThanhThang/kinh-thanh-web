import { describe, expect, it, vi } from 'vitest';
import raw from '../../../../data/store-info.json';
import {
  EMPTY_STORE_INFO,
  normalizeStoreInfo,
  telHref,
  zaloUrl,
} from '@/lib/services/store-info-core';
import { storeInfoSchema } from '../store-info';

describe('data/store-info.json', () => {
  it('hợp lệ với schema, đang là nội dung tạm và có 12–14 câu hỏi', () => {
    const r = storeInfoSchema.safeParse(raw);
    expect(r.success).toBe(true);
    if (!r.success) return;
    expect(r.data.placeholder).toBe(true);
    expect(r.data.faq.length).toBeGreaterThanOrEqual(12);
    expect(r.data.faq.length).toBeLessThanOrEqual(14);
    expect(r.data.storage.tips.length).toBeGreaterThan(0);
  });

  it('có đủ dữ liệu cho trang Thông tin (nhóm hỏi đáp, quy trình, khu vực, đổi trả, bảo quản)', () => {
    const d = storeInfoSchema.parse(raw);
    expect(new Set(d.faq.map((f) => f.group))).toEqual(
      new Set(['Đặt hàng', 'Hộp & thiệp', 'Giao nhận', 'Thanh toán']),
    );
    expect(d.shipping.steps).toHaveLength(4);
    expect(d.shipping.zones.length).toBeGreaterThan(0);
    expect(d.returns.eligible.length).toBeGreaterThan(0);
    expect(d.returns.howTo).toHaveLength(3);
    expect(d.returns.exclusions.length).toBeGreaterThan(0);
    expect(d.storage.do.length).toBeGreaterThan(0);
    expect(d.storage.avoid.length).toBeGreaterThan(0);
    expect(d.storage.enjoy.length).toBeGreaterThan(0);
    expect(d.storage.range).toEqual({ min: 16, max: 18 });
  });
});

describe('storeInfoSchema: trường mới là tuỳ chọn (tương thích ngược)', () => {
  it('dữ liệu cũ không có trường mới vẫn hợp lệ và nhận giá trị mặc định', () => {
    const old = JSON.parse(JSON.stringify(raw)) as {
      shipping: Record<string, unknown>;
      returns: { policy: string };
      storage: { tips: string[] };
      faq: { question: string; answer: string }[];
    };
    delete old.shipping.steps;
    delete old.shipping.zones;
    old.returns = { policy: old.returns.policy };
    old.storage = { tips: old.storage.tips };
    old.faq = old.faq.map((f) => ({
      question: f.question,
      answer: f.answer,
    }));
    const r = storeInfoSchema.parse(old);
    expect(r.shipping.steps).toEqual([]);
    expect(r.shipping.zones).toEqual([]);
    expect(r.returns.eligible).toEqual([]);
    expect(r.storage.range).toEqual({ min: 16, max: 18 });
    expect(r.storage.shelfLife).toBe('');
    expect(r.faq.every((f) => f.group === '')).toBe(true);
  });

  it('range đảo ngược hoặc khu vực thiếu thời gian thì lỗi', () => {
    const d = JSON.parse(JSON.stringify(raw)) as {
      shipping: Record<string, unknown>;
      storage: Record<string, unknown>;
    };
    expect(
      storeInfoSchema.safeParse({ ...d, storage: { ...d.storage, range: { min: 20, max: 10 } } })
        .success,
    ).toBe(false);
    expect(
      storeInfoSchema.safeParse({
        ...d,
        shipping: { ...d.shipping, zones: [{ area: 'A', leadTime: '' }] },
      }).success,
    ).toBe(false);
  });
});

describe('storeInfoSchema', () => {
  const base = JSON.parse(JSON.stringify(raw)) as typeof raw;
  const withContact = (over: Record<string, string>) => ({
    ...base,
    contact: { ...base.contact, ...over },
  });

  it('cho phép zalo/facebook/email rỗng', () => {
    expect(
      storeInfoSchema.safeParse(withContact({ zalo: '', facebook: '', email: '' })).success,
    ).toBe(true);
  });

  it('từ chối email, zalo, facebook sai định dạng', () => {
    expect(storeInfoSchema.safeParse(withContact({ email: 'abc' })).success).toBe(false);
    expect(storeInfoSchema.safeParse(withContact({ zalo: 'zalo.me/abc' })).success).toBe(false);
    expect(storeInfoSchema.safeParse(withContact({ facebook: 'facebook.com/x' })).success).toBe(
      false,
    );
  });

  it('thiếu placeholder hoặc faq rỗng chữ thì lỗi', () => {
    const rest: Record<string, unknown> = { ...base };
    delete rest.placeholder;
    expect(storeInfoSchema.safeParse(rest).success).toBe(false);
    expect(
      storeInfoSchema.safeParse({ ...base, faq: [{ question: '', answer: 'x' }] }).success,
    ).toBe(false);
  });
});

describe('normalizeStoreInfo', () => {
  it('hợp lệ → trả nguyên dữ liệu, không cảnh báo', () => {
    const warn = vi.fn();
    expect(normalizeStoreInfo(raw, warn).contact.phone).toBe('0900 000 000');
    expect(warn).not.toHaveBeenCalled();
  });

  it('sai → cảnh báo nêu đường dẫn trường và trả bản rỗng', () => {
    const warn = vi.fn();
    expect(normalizeStoreInfo({ placeholder: 'yes' }, warn)).toBe(EMPTY_STORE_INFO);
    expect(warn).toHaveBeenCalledOnce();
    expect(String(warn.mock.calls[0]?.[0])).toContain('placeholder');
  });
});

describe('liên kết', () => {
  it('zaloUrl chỉ lấy chữ số, rỗng thì null', () => {
    expect(zaloUrl('0900 000 000')).toBe('https://zalo.me/0900000000');
    expect(zaloUrl('')).toBeNull();
  });
  it('telHref bỏ dấu cách', () => {
    expect(telHref('0900 000 000')).toBe('tel:0900000000');
    expect(telHref('')).toBeNull();
  });
});
