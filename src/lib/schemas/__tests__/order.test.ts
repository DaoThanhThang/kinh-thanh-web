import { describe, expect, it } from 'vitest';
import {
  createCustomerSchema,
  earliestDeliveryDate,
  isRealISODate,
  isValidPhone,
  normalizePhone,
  orderPayloadSchema,
  type CustomerInput,
} from '../order';

const NOW = new Date(2026, 10, 11, 15, 30); // 11/11/2026 giờ địa phương

const valid: CustomerInput = {
  name: '  Nguyễn Văn An ',
  phone: '0912 345 678',
  email: '',
  address: '12 Phố Huế',
  province: 'Hà Nội',
  desiredDate: '',
  note: '',
  payment: 'cod',
};

const parse = (over: Partial<CustomerInput> = {}) =>
  createCustomerSchema(NOW).safeParse({ ...valid, ...over });

const messageFor = (over: Partial<CustomerInput>, field: string) => {
  const r = parse(over);
  if (r.success) return null;
  return r.error.issues.find((i) => i.path[0] === field)?.message ?? null;
};

describe('phone', () => {
  it.each([
    ['0912345678', '0912345678'],
    ['0912 345 678', '0912345678'],
    ['0912.345.678', '0912345678'],
    ['0912-345-678', '0912345678'],
    ['  0388 123 456 ', '0388123456'],
    ['0212 345 678', '0212345678'], // máy bàn
    ['0283.822.123', '0283822123'], // máy bàn có dấu chấm
  ])('chấp nhận và chuẩn hoá %s', (raw, normalized) => {
    expect(normalizePhone(raw.trim())).toBe(normalized);
    const r = parse({ phone: raw });
    expect(r.success && r.data.phone).toBe(normalized);
  });

  it.each([
    '091234567', // 9 số
    '09123456789', // 11 số
    '1912345678', // không bắt đầu bằng 0
    '+84912345678',
    '09123abc78',
  ])('từ chối %s với lời nhắc sửa', (raw) => {
    expect(isValidPhone(raw)).toBe(false);
    expect(messageFor({ phone: raw }, 'phone')).toBe(
      'Số điện thoại cần 10 chữ số, bắt đầu bằng 0.',
    );
  });

  it('để trống → nhắc nhập', () => {
    expect(messageFor({ phone: '  ' }, 'phone')).toMatch(/nhập số điện thoại/);
  });
});

describe('email', () => {
  it('không bắt buộc: rỗng → undefined', () => {
    const r = parse({ email: '   ' });
    expect(r.success && r.data.email).toBeUndefined();
  });
  it('hợp lệ thì giữ (đã trim)', () => {
    const r = parse({ email: ' an@example.com ' });
    expect(r.success && r.data.email).toBe('an@example.com');
  });
  it('sai dạng → báo lỗi và cách sửa', () => {
    expect(messageFor({ email: 'an@' }, 'email')).toMatch(/Email chưa đúng dạng/);
  });
});

describe('ngày nhận', () => {
  it('ngày mai là sớm nhất', () => {
    expect(earliestDeliveryDate(NOW)).toBe('2026-11-12');
    expect(earliestDeliveryDate(new Date(2026, 11, 31, 23, 59))).toBe('2027-01-01');
  });
  it('rỗng được; hôm nay và quá khứ bị từ chối; từ ngày mai trở đi được', () => {
    expect(parse({ desiredDate: '' }).success).toBe(true);
    expect(messageFor({ desiredDate: '2026-11-11' }, 'desiredDate')).toMatch(/từ ngày mai/);
    expect(messageFor({ desiredDate: '2026-01-01' }, 'desiredDate')).toMatch(/từ ngày mai/);
    const ok = parse({ desiredDate: '2026-11-12' });
    expect(ok.success && ok.data.desiredDate).toBe('2026-11-12');
    expect(parse({ desiredDate: '2027-03-01' }).success).toBe(true);
  });
  it('ngày không có thật bị từ chối', () => {
    expect(isRealISODate('2027-02-30')).toBe(false);
    expect(isRealISODate('2027-02-28')).toBe(true);
    expect(messageFor({ desiredDate: '2027-02-30' }, 'desiredDate')).toMatch(/chưa hợp lệ/);
    expect(messageFor({ desiredDate: 'mai' }, 'desiredDate')).toMatch(/chưa hợp lệ/);
  });
});

describe('các trường khác', () => {
  it('bắt buộc: họ tên, địa chỉ, tỉnh/thành', () => {
    expect(messageFor({ name: ' ' }, 'name')).toMatch(/họ tên/);
    expect(messageFor({ address: '' }, 'address')).toMatch(/địa chỉ/);
    expect(messageFor({ province: '' }, 'province')).toMatch(/tỉnh/);
  });
  it('trim, ghi chú rỗng → undefined, quá dài bị báo', () => {
    const r = parse({ note: '  ' });
    expect(r.success && r.data.name).toBe('Nguyễn Văn An');
    expect(r.success && r.data.note).toBeUndefined();
    expect(messageFor({ note: 'x'.repeat(501) }, 'note')).toMatch(/tối đa 500/);
  });
  it('phương thức thanh toán chỉ cod | transfer', () => {
    expect(parse({ payment: 'transfer' }).success).toBe(true);
    expect(parse({ payment: 'momo' as never }).success).toBe(false);
  });
});

describe('orderPayloadSchema', () => {
  it('nhận payload đúng hình dạng', () => {
    const payload = {
      version: 1,
      createdAt: new Date().toISOString(),
      customer: {
        name: 'An',
        phone: '0912345678',
        address: 'x',
        province: 'y',
        payment: 'cod',
      },
      box: {
        size: 6,
        slots: ['01'],
        items: [{ id: '01', name: 'Chocolate 01', qty: 1, unitPrice: 35000 }],
      },
      card: { message: 'hi', from: '', to: '' },
      pricing: { box: 120000, pieces: 35000, total: 155000 },
    };
    expect(orderPayloadSchema.safeParse(payload).success).toBe(true);
    expect(orderPayloadSchema.safeParse({ ...payload, version: 2 }).success).toBe(false);
  });
});
