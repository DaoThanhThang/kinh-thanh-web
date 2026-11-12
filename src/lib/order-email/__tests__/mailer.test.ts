// @vitest-environment node
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { sampleOrder } from '@/lib/order-server/__tests__/fixtures';
import { readMailConfig, sendOrderEmails } from '../mailer';

const TRAY = Buffer.from('png-bytes');
const ENV = {
  SMTP_HOST: 'smtp.gmail.com',
  SMTP_USER: 'shop@gmail.com',
  SMTP_PASS: 'app password',
};

describe('readMailConfig', () => {
  it('thiếu host/user/pass → null', () => {
    expect(readMailConfig({})).toBeNull();
    expect(readMailConfig({ ...ENV, SMTP_PASS: '' })).toBeNull();
  });

  it('mặc định cổng 465 + secure, địa chỉ shop abc@gmail.com, from = user', () => {
    expect(readMailConfig(ENV)).toMatchObject({
      port: 465,
      secure: true,
      from: 'shop@gmail.com',
      shopEmail: 'abc@gmail.com',
    });
  });

  it('SMTP_SECURE/PORT/MAIL_FROM/SHOP_ORDER_EMAIL tuỳ chỉnh, MAIL_FROM dạng "Tên <addr>"', () => {
    expect(
      readMailConfig({
        ...ENV,
        SMTP_PORT: '587',
        MAIL_FROM: 'Kinh Thanh <order@kinhthanh.vn>',
        SHOP_ORDER_EMAIL: 'bep@kinhthanh.vn',
      }),
    ).toMatchObject({
      port: 587,
      secure: false,
      from: 'order@kinhthanh.vn',
      shopEmail: 'bep@kinhthanh.vn',
    });
    expect(readMailConfig({ ...ENV, SMTP_PORT: '587', SMTP_SECURE: 'true' })?.secure).toBe(true);
  });
});

describe('sendOrderEmails: có SMTP', () => {
  const make = (impl?: (msg: { to: string }) => Promise<unknown>) => {
    const sendMail = vi.fn(impl ?? (async () => ({})));
    return { sendMail, createTransport: () => ({ sendMail }) as never };
  };

  it('gửi email shop (kèm khay CID + đính kèm) rồi email khách', async () => {
    const t = make();
    const res = await sendOrderEmails(sampleOrder(), TRAY, {
      env: ENV,
      createTransport: t.createTransport,
    });
    expect(res.mode).toBe('sent');
    expect(t.sendMail).toHaveBeenCalledTimes(2);
    const [shop, customer] = t.sendMail.mock.calls.map((c) => c[0] as Record<string, unknown>);
    expect(shop).toMatchObject({
      to: 'abc@gmail.com',
      replyTo: 'an@example.com',
      from: { name: 'Kinh Thành Chocolate', address: 'shop@gmail.com' },
    });
    expect(String(shop?.subject)).toMatch(/^Đơn mới KT-20261112-0482/);
    expect(shop?.attachments).toEqual([
      expect.objectContaining({
        filename: 'KT-20261112-0482-khay.png',
        cid: 'khay-tray@kinhthanh',
        content: TRAY,
      }),
    ]);
    expect(customer).toMatchObject({ to: 'an@example.com', replyTo: 'abc@gmail.com' });
  });

  it('khách không có email → chỉ gửi cho shop', async () => {
    const t = make();
    const order = sampleOrder();
    delete order.customer.email;
    await sendOrderEmails(order, TRAY, { env: ENV, createTransport: t.createTransport });
    expect(t.sendMail).toHaveBeenCalledTimes(1);
    expect(t.sendMail.mock.calls[0]?.[0]).not.toHaveProperty('replyTo');
  });

  it('lỗi gửi cho shop → ném lỗi', async () => {
    const t = make(async () => {
      throw new Error('535 auth');
    });
    await expect(
      sendOrderEmails(sampleOrder(), TRAY, { env: ENV, createTransport: t.createTransport }),
    ).rejects.toThrow('535');
  });

  it('lỗi gửi xác nhận cho khách → vẫn thành công, chỉ ghi log', async () => {
    const t = make(async (msg) => {
      if (msg.to === 'an@example.com') throw new Error('mailbox full');
      return {};
    });
    const log = vi.fn();
    const res = await sendOrderEmails(sampleOrder(), TRAY, {
      env: ENV,
      createTransport: t.createTransport,
      log,
    });
    expect(res.mode).toBe('sent');
    expect(log).toHaveBeenCalled();
  });
});

describe('sendOrderEmails: chưa cấu hình SMTP', () => {
  it('chế độ xem trước: ghi HTML + PNG vào thư mục, không gửi', async () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), 'kt-preview-'));
    const log = vi.fn();
    const res = await sendOrderEmails(sampleOrder(), TRAY, { env: {}, previewDir: dir, log });
    expect(res.mode).toBe('preview');
    for (const name of [
      'KT-20261112-0482-khay.png',
      'KT-20261112-0482-shop.html',
      'KT-20261112-0482-customer.html',
    ]) {
      expect(existsSync(path.join(dir, name))).toBe(true);
    }
    const html = readFileSync(path.join(dir, 'KT-20261112-0482-shop.html'), 'utf8');
    expect(html).toContain('src="KT-20261112-0482-khay.png"');
    expect(html).not.toContain('cid:');
    expect(log).toHaveBeenCalledWith(expect.stringContaining(dir));
  });

  it('trên Vercel mà thiếu SMTP → ném lỗi (không giả vờ thành công)', async () => {
    await expect(sendOrderEmails(sampleOrder(), TRAY, { env: { VERCEL: '1' } })).rejects.toThrow(
      /SMTP/,
    );
  });
});
