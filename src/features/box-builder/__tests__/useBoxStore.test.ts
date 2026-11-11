import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BOXES, CHOCOLATES, seq } from './fixtures';
import {
  BOX_STORAGE_KEY,
  hydrateBoxStore,
  selectFilledCount,
  selectIsFull,
  useBoxStore,
  usePricing,
} from '../store/useBoxStore';

const get = () => useBoxStore.getState();
const stored = () => {
  const raw = localStorage.getItem(BOX_STORAGE_KEY);
  return raw ? (JSON.parse(raw) as { state: Record<string, unknown>; version: number }) : null;
};

beforeEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
  act(() => get().reset());
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('actions', () => {
  it('selectSize tạo slots; chọn lại cùng size không đổi gì', () => {
    get().selectSize(6);
    expect(get().size).toBe(6);
    expect(get().slots).toHaveLength(6);
    get().placeAt(0, '01');
    get().selectSize(6);
    expect(get().slots[0]).toBe('01');
  });

  it('selectSize khi đã có viên áp dụng quy tắc resize', () => {
    get().selectSize(9);
    get().placeAt(2, '01');
    get().placeAt(5, '02');
    get().placeAt(8, '03');
    get().selectSize(6);
    expect(get().slots).toEqual(['01', '02', '03', null, null, null]);
    get().selectSize(12);
    expect(get().slots).toHaveLength(12);
    expect(get().slots.slice(0, 3)).toEqual(['01', '02', '03']);
  });

  it('placeAt / removeAt / swap / clearAll', () => {
    get().selectSize(6);
    get().placeAt(0, '01');
    get().placeAt(1, '02');
    get().swap(0, 1);
    expect(get().slots.slice(0, 2)).toEqual(['02', '01']);
    get().swap(0, 4);
    expect(get().slots[4]).toBe('02');
    get().removeAt(1);
    expect(get().slots[1]).toBeNull();
    get().placeAt(99, 'x');
    expect(get().slots).toHaveLength(6);
    get().clearAll();
    expect(get().slots.every((s) => s === null)).toBe(true);
    expect(get().size).toBe(6);
  });

  it('placeInFirstEmpty trả index, null khi đầy hoặc chưa chọn size', () => {
    expect(get().placeInFirstEmpty('01')).toBeNull();
    get().selectSize(6);
    expect(get().placeInFirstEmpty('01')).toBe(0);
    expect(get().placeInFirstEmpty('02')).toBe(1);
    for (let i = 0; i < 4; i++) get().placeInFirstEmpty('03');
    expect(get().placeInFirstEmpty('01')).toBeNull();
    expect(get().slots).toHaveLength(6);
  });

  it('fillRandom chỉ điền ô trống bằng viên còn bán', () => {
    get().selectSize(6);
    get().placeAt(0, '03');
    get().fillRandom(CHOCOLATES, seq(0, 0.5));
    expect(get().slots[0]).toBe('03');
    expect(get().slots.every((s) => s !== null && s !== '04')).toBe(true);
  });

  it('setMessage cắt 150 ký tự và NFC', () => {
    get().setMessage('😀'.repeat(200));
    expect(Array.from(get().message)).toHaveLength(150);
    get().setMessage('ệ');
    expect(get().message).toBe('ệ');
  });

  it('setFrom/setTo cắt 40 ký tự, một dòng', () => {
    get().setFrom('a'.repeat(100));
    get().setTo('Lan\nAnh');
    expect(Array.from(get().from)).toHaveLength(40);
    expect(get().to).toBe('Lan Anh');
  });

  it('reset về trạng thái đầu', () => {
    get().selectSize(6);
    get().setMessage('x');
    get().setFrom('Minh');
    get().reset();
    expect(get().from).toBe('');
    expect(get().size).toBeNull();
    expect(get().slots).toEqual([]);
    expect(get().message).toBe('');
  });

  it('selectors', () => {
    get().selectSize(6);
    get().placeInFirstEmpty('01');
    expect(selectFilledCount(get())).toBe(1);
    expect(selectIsFull(6)(get())).toBe(false);
    get().fillRandom(CHOCOLATES, seq(0));
    expect(selectIsFull(6)(get())).toBe(true);
    expect(selectIsFull(9)(get())).toBe(false);
    expect(selectIsFull(0)(get())).toBe(false);
  });
});

describe('usePricing', () => {
  it('tính giá, cập nhật theo store và không gây vòng lặp render', () => {
    let renders = 0;
    const { result } = renderHook(() => {
      renders++;
      return usePricing(CHOCOLATES, BOXES);
    });
    expect(result.current.total).toBe(0);
    act(() => {
      get().selectSize(6);
      get().placeAt(0, '01');
    });
    expect(result.current.total).toBe(120000 + 35000);
    expect(result.current.filled).toBe(1);
    const before = renders;
    act(() => get().setMessage('đổi lời nhắn')); // không ảnh hưởng giá
    expect(renders).toBe(before);
  });
});

describe('persist', () => {
  it('chỉ ghi size, slots, message (không ghi action), version 1', () => {
    get().selectSize(6);
    get().placeAt(0, '01');
    get().setMessage('Xin chào');
    const s = stored();
    expect(s?.version).toBe(1);
    expect(Object.keys(s?.state ?? {}).sort()).toEqual(['from', 'message', 'size', 'slots', 'to']);
    expect(s?.state.size).toBe(6);
    expect(s?.state.message).toBe('Xin chào');
  });

  it('lưu và đọc lại from/to, dữ liệu cũ thiếu from/to → rỗng', async () => {
    get().setFrom('Minh');
    get().setTo('Lan');
    expect(stored()?.state).toMatchObject({ from: 'Minh', to: 'Lan' });
    localStorage.setItem(
      BOX_STORAGE_KEY,
      JSON.stringify({ state: { size: 6, slots: [], message: 'm' }, version: 1 }),
    );
    await hydrateBoxStore();
    expect(get().from).toBe('');
    expect(get().to).toBe('');
  });

  it('rehydrate đọc lại dữ liệu đã lưu', async () => {
    localStorage.setItem(
      BOX_STORAGE_KEY,
      JSON.stringify({
        state: { size: 6, slots: ['01', null, '02', null, null, null], message: 'hi' },
        version: 1,
      }),
    );
    expect(get().size).toBeNull();
    await hydrateBoxStore();
    expect(get().size).toBe(6);
    expect(get().slots[2]).toBe('02');
    expect(get().message).toBe('hi');
    expect(typeof get().placeAt).toBe('function');
  });

  it('dữ liệu hỏng không làm crash, được ép về hình dạng hợp lệ', async () => {
    localStorage.setItem(
      BOX_STORAGE_KEY,
      JSON.stringify({ state: { size: 'x', slots: 5, message: 42 }, version: 1 }),
    );
    await hydrateBoxStore();
    expect(get().size).toBeNull();
    expect(get().slots).toEqual([]);
    expect(get().message).toBe('');
  });

  it('JSON hỏng hoặc version cũ không crash', async () => {
    localStorage.setItem(BOX_STORAGE_KEY, '{not json');
    await expect(hydrateBoxStore()).resolves.toBeUndefined();
    localStorage.setItem(
      BOX_STORAGE_KEY,
      JSON.stringify({
        state: { size: 6, slots: [null, null, null, null, null, null] },
        version: 0,
      }),
    );
    await hydrateBoxStore();
    expect(get().size).toBe(6);
  });

  it('rehydrate + sanitizeWith: loại id đã xóa/hết hàng và size lạ', async () => {
    localStorage.setItem(
      BOX_STORAGE_KEY,
      JSON.stringify({
        state: { size: 6, slots: ['01', 'gone', '04', null, null, null], message: 'm' },
        version: 1,
      }),
    );
    await hydrateBoxStore();
    const removed = get().sanitizeWith(CHOCOLATES, BOXES);
    expect(removed).toEqual(['gone', '04']);
    expect(get().slots).toEqual(['01', null, null, null, null, null]);

    act(() => get().selectSize(16));
    const removed2 = get().sanitizeWith(CHOCOLATES, BOXES);
    expect(removed2).toEqual(['01']);
    expect(get().size).toBeNull();
    expect(get().slots).toEqual([]);
    expect(get().message).toBe('m');
  });

  it('storage ném lỗi: không crash, store vẫn chạy trong bộ nhớ', async () => {
    const boom = () => {
      throw new Error('blocked');
    };
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(boom);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(boom);
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(boom);
    await expect(hydrateBoxStore()).resolves.toBeUndefined();
    expect(() => {
      get().selectSize(6);
      get().placeAt(0, '01');
      get().reset();
      get().selectSize(9);
    }).not.toThrow();
    expect(get().size).toBe(9);
  });
});
