import { describe, expect, it } from 'vitest';
import { sampleOrder } from '@/lib/order-server/__tests__/fixtures';
import { renderCustomerEmail, renderShopEmail, TRAY_CID } from '../render';
import { escMultiline, headerSafe } from '../html';

describe('renderShopEmail', () => {
  const order = sampleOrder();
  const mail = renderShopEmail(order);

  it('tiêu đề đúng mẫu và không có xuống dòng', () => {
    expect(mail.subject).toBe('Đơn mới KT-20261112-0482 · Hộp 12 viên · 865.000 ₫ · Nguyễn Văn An');
    expect(mail.subject).not.toMatch(/[\r\n]/);
  });

  it('subject bỏ CR/LF trong tên khách (chống header injection)', () => {
    const evil = sampleOrder({
      customer: { ...order.customer, name: 'An\r\nBcc: x@evil.com' },
    });
    const { subject } = renderShopEmail(evil);
    expect(subject).not.toMatch(/[\r\n]/);
    expect(subject).toContain('An Bcc: x@evil.com');
  });

  it('có đủ ô 1..12 với tên và mã viên, ảnh khay qua CID', () => {
    expect(mail.html).toContain(`src="cid:${TRAY_CID}"`);
    for (const c of order.cells) {
      expect(mail.html).toContain(`>${c.n}</td>`);
      expect(mail.text).toContain(`Ô ${c.n}: ${c.name} (${c.id})`);
    }
    expect(order.cells).toHaveLength(12);
  });

  it('gom viên, đơn giá, thành tiền, giá hộp và tổng', () => {
    // 3×1 (45k) … viên 07 ×3 = 3 × 65.000
    expect(mail.html).toContain('195.000 ₫');
    expect(mail.html).toContain('180.000 ₫');
    expect(mail.html).toContain('865.000 ₫');
    expect(mail.text).toContain('Chocolate 07 (07) x 3 · 65.000 ₫ = 195.000 ₫');
    expect(mail.text).toContain('Tổng cộng: 865.000 ₫');
  });

  it('có thiệp, khách (tel:, mailto:), ngày nhận, checklist; bản text cùng thông tin', () => {
    expect(mail.html).toContain('href="tel:0912345678"');
    expect(mail.html).toContain('href="mailto:an@example.com"');
    expect(mail.html).toContain('20/12/2099');
    expect(mail.html).toContain('Checklist chuẩn bị');
    expect(mail.html).toContain('Chúc mừng sinh nhật!<br>Yêu em nhiều.');
    expect(mail.text).toContain('Chúc mừng sinh nhật!\nYêu em nhiều.');
    expect(mail.text).toContain('0912345678');
    expect(mail.text).toContain('12 Phố Huế');
  });

  it('escape HTML trong mọi chữ khách nhập', () => {
    const evil = sampleOrder({
      card: { message: '<script>alert(1)</script> & "q"\n<b>x</b>', to: '<i>L</i>', from: "M'" },
      customer: { name: '<img src=x onerror=1>', phone: '0912345678', email: 'a"b@x.com' },
      delivery: { address: '<a href="x">addr</a>', province: '<u>HN</u>', note: '<svg/onload=1>' },
    });
    const { html } = renderShopEmail(evil);
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<img src=x');
    expect(html).not.toContain('<svg/onload');
    expect(html).not.toContain('<b>x</b>');
    expect(html).toContain(
      '&lt;script&gt;alert(1)&lt;/script&gt; &amp; &quot;q&quot;<br>&lt;b&gt;x&lt;/b&gt;',
    );
    expect(html).toContain('&lt;a href=&quot;x&quot;&gt;addr&lt;/a&gt;');
  });
});

describe('renderCustomerEmail', () => {
  it('cảm ơn, mã đơn, ảnh khay, tóm tắt, câu xác nhận', () => {
    const order = sampleOrder();
    const mail = renderCustomerEmail(order);
    expect(mail.subject).toBe('Kinh Thành đã nhận đơn KT-20261112-0482 của bạn');
    expect(mail.html).toContain('KT-20261112-0482');
    expect(mail.html).toContain(`src="cid:${TRAY_CID}"`);
    expect(mail.html).toContain('Kinh Thành sẽ liên hệ để xác nhận đơn.');
    expect(mail.html).toContain('865.000 ₫');
    expect(mail.text).toContain('Kinh Thành sẽ liên hệ để xác nhận đơn.');
  });

  it('chuyển khoản có ghi chú hướng dẫn', () => {
    const mail = renderCustomerEmail(sampleOrder({ payment: 'transfer' }));
    expect(mail.html).toContain('Hướng dẫn chuyển khoản');
  });
});

describe('html helpers', () => {
  it('escMultiline giữ xuống dòng, headerSafe bỏ mọi kiểu xuống dòng', () => {
    expect(escMultiline('a\r\nb\nc<')).toBe('a<br>b<br>c&lt;');
    expect(headerSafe('a\r\nb c\u0000d')).toBe('a b cd');
  });
});
