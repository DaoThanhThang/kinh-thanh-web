import { buildOrderRecord } from '../build-order';
import type { BoxOption } from '@/lib/schemas/box';
import type { Chocolate } from '@/lib/schemas/chocolate';
import type { OrderRecord } from '../types';

export const CHOCOLATES: Chocolate[] = Array.from({ length: 12 }, (_, i) => {
  const id = String(i + 1).padStart(2, '0');
  return {
    id,
    name: `Chocolate ${id}`,
    price: 35000 + i * 5000,
    image: `/chocolates/${id}.svg`,
    description: '',
    flavorNotes: [],
    allergens: null,
    available: id !== '12',
    sortOrder: i + 1,
  };
});

export const BOXES: BoxOption[] = [
  { size: 6, cols: 3, rows: 2, price: 120000, name: 'Hộp 6 viên' },
  { size: 12, cols: 4, rows: 3, price: 180000, name: 'Hộp 12 viên' },
];

export const SLOTS_12 = ['03', '04', '04', '01', '07', '07', '07', '02', '11', '05', '05', '09'];

/** Yêu cầu hợp lệ (đúng hình dạng client gửi tới /api/order). */
export const validRequest = (over: Record<string, unknown> = {}) => ({
  customer: { name: 'Nguyễn Văn An', phone: '0912.345.678', email: 'an@example.com' },
  delivery: {
    address: '12 Phố Huế, Phường Phạm Đình Hổ',
    province: 'Hà Nội',
    desiredDate: '2099-12-20',
    note: 'Giao giờ hành chính.',
  },
  payment: 'cod',
  box: { size: 12, slots: SLOTS_12 },
  message: 'Chúc mừng sinh nhật!\nYêu em nhiều.',
  to: 'Lan',
  from: 'Minh',
  website: '',
  ...over,
});

export function sampleOrder(over: Partial<OrderRecord> = {}): OrderRecord {
  const built = buildOrderRecord({
    request: {
      customer: {
        name: 'Nguyễn Văn An',
        phone: '0912345678',
        email: 'an@example.com',
        address: '12 Phố Huế, Phường Phạm Đình Hổ',
        province: 'Hà Nội',
        desiredDate: '2099-12-20',
        note: 'Giao giờ hành chính.',
        payment: 'cod',
      },
      box: { size: 12, slots: SLOTS_12 },
      card: { message: 'Chúc mừng sinh nhật!\nYêu em nhiều.', to: 'Lan', from: 'Minh' },
    },
    chocolates: CHOCOLATES,
    boxes: BOXES,
    orderId: 'KT-20261112-0482',
    now: new Date('2026-11-12T07:05:00.000Z'),
  });
  if (!built.ok) throw new Error(built.error);
  return { ...built.order, ...over };
}
