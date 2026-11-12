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
  it('hợp lệ với schema, đang là nội dung tạm và có 6–8 câu hỏi', () => {
    const r = storeInfoSchema.safeParse(raw);
    expect(r.success).toBe(true);
    if (!r.success) return;
    expect(r.data.placeholder).toBe(true);
    expect(r.data.faq.length).toBeGreaterThanOrEqual(6);
    expect(r.data.faq.length).toBeLessThanOrEqual(8);
    expect(r.data.storage.tips.length).toBeGreaterThan(0);
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
