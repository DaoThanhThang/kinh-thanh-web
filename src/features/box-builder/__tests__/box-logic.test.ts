import { describe, expect, it } from 'vitest';
import {
  MESSAGE_MAX,
  NAME_MAX,
  clampName,
  clampMessage,
  clearAll,
  countById,
  createSlots,
  fillRandom,
  placeAt,
  placeInFirstEmpty,
  previewResize,
  pricing,
  removeAt,
  resize,
  sanitize,
  swap,
} from '../model/box-logic';
import { BOXES, CHOCOLATES, seq } from './fixtures';

describe('createSlots', () => {
  it('tạo mảng null đúng độ dài', () => {
    expect(createSlots(6)).toEqual([null, null, null, null, null, null]);
  });
  it('size không hợp lệ → mảng rỗng', () => {
    expect(createSlots(0)).toEqual([]);
    expect(createSlots(-3)).toEqual([]);
    expect(createSlots(2.5)).toEqual([]);
  });
});

describe('placeAt', () => {
  it('đặt vào ô trống và không đổi mảng gốc', () => {
    const s = createSlots(3);
    expect(placeAt(s, 1, 'a')).toEqual([null, 'a', null]);
    expect(s).toEqual([null, null, null]);
  });
  it('thay viên đang có', () => {
    expect(placeAt(['a', null], 0, 'b')).toEqual(['b', null]);
  });
  it('index ngoài phạm vi → giữ nguyên tham chiếu', () => {
    const s = createSlots(3);
    expect(placeAt(s, -1, 'a')).toBe(s);
    expect(placeAt(s, 3, 'a')).toBe(s);
    expect(placeAt(s, 1.5, 'a')).toBe(s);
    expect(placeAt(s, Number.NaN, 'a')).toBe(s);
  });
});

describe('placeInFirstEmpty', () => {
  it('đặt vào ô trống đầu tiên', () => {
    expect(placeInFirstEmpty(['a', null, null], 'b')).toEqual({
      slots: ['a', 'b', null],
      index: 1,
    });
  });
  it('lấp lỗ trống ở giữa', () => {
    expect(placeInFirstEmpty(['a', null, 'c'], 'b').index).toBe(1);
  });
  it('hộp đầy → index null, slots không đổi', () => {
    const s = ['a', 'b'];
    const r = placeInFirstEmpty(s, 'c');
    expect(r.index).toBeNull();
    expect(r.slots).toBe(s);
  });
  it('hộp rỗng (chưa chọn size) → null', () => {
    expect(placeInFirstEmpty([], 'a').index).toBeNull();
  });
});

describe('removeAt', () => {
  it('xóa viên', () => {
    expect(removeAt(['a', 'b'], 0)).toEqual([null, 'b']);
  });
  it('ô trống hoặc ngoài phạm vi → không đổi', () => {
    const s = ['a', null];
    expect(removeAt(s, 1)).toBe(s);
    expect(removeAt(s, 5)).toBe(s);
    expect(removeAt(s, -1)).toBe(s);
  });
});

describe('swap', () => {
  it('hoán đổi hai viên', () => {
    expect(swap(['a', 'b', 'c'], 0, 2)).toEqual(['c', 'b', 'a']);
  });
  it('chuyển viên sang ô trống', () => {
    expect(swap(['a', null], 0, 1)).toEqual([null, 'a']);
  });
  it('cùng ô hoặc ngoài phạm vi → không đổi', () => {
    const s = ['a', 'b'];
    expect(swap(s, 1, 1)).toBe(s);
    expect(swap(s, 0, 2)).toBe(s);
    expect(swap(s, -1, 0)).toBe(s);
  });
});

describe('clearAll', () => {
  it('xóa hết nhưng giữ độ dài', () => {
    expect(clearAll(['a', null, 'b'])).toEqual([null, null, null]);
  });
});

describe('fillRandom', () => {
  it('chỉ điền ô trống, giữ viên đã có', () => {
    const r = fillRandom(['02', null, null], CHOCOLATES, seq(0, 0.5));
    expect(r[0]).toBe('02');
    expect(r.every((x) => x !== null)).toBe(true);
  });
  it('xác định với rng cố định (pool chỉ gồm viên còn bán)', () => {
    // pool = 01,02,03
    expect(fillRandom(createSlots(4), CHOCOLATES, seq(0, 0.34, 0.67, 0.999))).toEqual([
      '01',
      '02',
      '03',
      '03',
    ]);
  });
  it('không bao giờ chọn viên hết hàng', () => {
    for (let i = 0; i < 50; i++) {
      const r = fillRandom(createSlots(16), CHOCOLATES, Math.random);
      expect(r).not.toContain('04');
    }
    expect(fillRandom(createSlots(2), CHOCOLATES, () => 0.9999999)).toEqual(['03', '03']);
  });
  it('cho phép lặp', () => {
    const r = fillRandom(createSlots(3), CHOCOLATES, () => 0);
    expect(r).toEqual(['01', '01', '01']);
  });
  it('rng trả giá trị ngoài [0,1) vẫn không vượt mảng', () => {
    expect(fillRandom(createSlots(2), CHOCOLATES, seq(1, -1))).toEqual(['03', '01']);
  });
  it('không có viên còn bán → không đổi', () => {
    const s = createSlots(2);
    expect(fillRandom(s, [], seq(0))).toBe(s);
    expect(
      fillRandom(
        s,
        CHOCOLATES.filter((c) => !c.available),
        seq(0),
      ),
    ).toBe(s);
  });
  it('hộp đã đầy → không đổi', () => {
    const s = ['01', '02'];
    expect(fillRandom(s, CHOCOLATES)).toBe(s);
  });
});

describe('previewResize / resize', () => {
  it('thu nhỏ: giữ theo thứ tự ô, dồn lên đầu, liệt kê viên bị bỏ', () => {
    const slots = [null, 'a', null, 'b', 'c', null, 'd', null, 'e'];
    expect(previewResize(slots, 3)).toEqual({ kept: ['a', 'b', 'c'], dropped: ['d', 'e'] });
  });
  it('thu nhỏ nhưng vẫn đủ chỗ → không bỏ viên nào', () => {
    const r = previewResize(['a', null, null, null, null, 'b', null, null, null], 6);
    expect(r.kept).toEqual(['a', 'b', null, null, null, null]);
    expect(r.dropped).toEqual([]);
  });
  it('phóng to: dồn lên đầu, thêm ô trống', () => {
    expect(resize([null, 'a', 'b'], 6)).toEqual(['a', 'b', null, null, null, null]);
  });
  it('giữ viên lặp', () => {
    expect(resize(['a', 'a', 'a'], 2)).toEqual(['a', 'a']);
    expect(previewResize(['a', 'a', 'a'], 2).dropped).toEqual(['a']);
  });
  it('hộp rỗng và size không đổi', () => {
    expect(resize([], 6)).toEqual(createSlots(6));
    expect(resize(['a', null], 2)).toEqual(['a', null]);
  });
  it('không đổi mảng gốc', () => {
    const s = ['a', 'b', 'c'];
    resize(s, 1);
    expect(s).toEqual(['a', 'b', 'c']);
  });
});

describe('countById', () => {
  it('đếm số lần mỗi id, bỏ qua ô trống', () => {
    expect(countById(['a', null, 'b', 'a'])).toEqual({ a: 2, b: 1 });
    expect(countById([])).toEqual({});
  });
});

describe('pricing', () => {
  it('giá hộp + giá viên (số nguyên VND)', () => {
    const p = pricing({ size: 6, slots: ['01', '01', '02', null, null, null] }, CHOCOLATES, BOXES);
    expect(p).toEqual({
      boxPrice: 120000,
      piecesPrice: 110000,
      total: 230000,
      filled: 3,
      capacity: 6,
      isFull: false,
      isEmpty: false,
    });
  });
  it('hộp đầy', () => {
    const p = pricing({ size: 6, slots: Array(6).fill('03') }, CHOCOLATES, BOXES);
    expect(p.isFull).toBe(true);
    expect(p.total).toBe(120000 + 6 * 45000);
  });
  it('id không có trong catalog bị bỏ qua khi tính giá', () => {
    const p = pricing({ size: 6, slots: ['01', 'zzz', null, null, null, null] }, CHOCOLATES, BOXES);
    expect(p.piecesPrice).toBe(35000);
    expect(p.filled).toBe(2);
  });
  it('chưa chọn size / size lạ → boxPrice 0, rỗng', () => {
    const p = pricing({ size: null, slots: [] }, CHOCOLATES, BOXES);
    expect(p).toEqual({
      boxPrice: 0,
      piecesPrice: 0,
      total: 0,
      filled: 0,
      capacity: 0,
      isFull: false,
      isEmpty: true,
    });
    expect(pricing({ size: 7, slots: createSlots(7) }, CHOCOLATES, BOXES).boxPrice).toBe(0);
  });
  it('hộp trống nhưng đã có size', () => {
    const p = pricing({ size: 9, slots: createSlots(9) }, CHOCOLATES, BOXES);
    expect(p.isEmpty).toBe(true);
    expect(p.isFull).toBe(false);
    expect(p.total).toBe(150000);
  });
});

describe('clampMessage', () => {
  it('giữ nguyên chuỗi ngắn', () => {
    expect(clampMessage('Chúc mừng')).toBe('Chúc mừng');
  });
  it('cắt đúng 150 ký tự', () => {
    expect(Array.from(clampMessage('a'.repeat(200)))).toHaveLength(MESSAGE_MAX);
  });
  it('tiếng Việt có dấu: không vỡ dấu', () => {
    const out = clampMessage('Ệ'.repeat(200));
    expect(Array.from(out)).toHaveLength(150);
    expect(out).toBe('Ệ'.repeat(150));
  });
  it('emoji (cặp thay thế) không bị cắt đôi', () => {
    const out = clampMessage('😀'.repeat(200));
    expect(Array.from(out)).toHaveLength(150);
    expect(out).toBe('😀'.repeat(150));
    // Cắt ngay giữa: ký tự thứ 150 là emoji trọn vẹn
    expect(clampMessage('a'.repeat(149) + '😀😀')).toBe('a'.repeat(149) + '😀');
  });
  it('chuẩn hóa NFC (dạng tổ hợp → dựng sẵn)', () => {
    const nfd = 'ệ'; // ê + dấu nặng
    const out = clampMessage(nfd);
    expect(out).toBe('ệ');
    expect(out.length).toBe(1);
  });
  it('NFC trước khi đếm: 150 chữ NFD vẫn giữ đủ', () => {
    expect(Array.from(clampMessage('ệ'.repeat(150)))).toHaveLength(150);
  });
  it('max tùy chỉnh', () => {
    expect(clampMessage('abcdef', 3)).toBe('abc');
  });
});

describe('clampName', () => {
  it('cắt theo code point ở 40 ký tự', () => {
    expect(Array.from(clampName('😀'.repeat(60)))).toHaveLength(NAME_MAX);
    expect(NAME_MAX).toBe(40);
  });
  it('xuống dòng thành dấu cách, chuẩn hoá NFC', () => {
    expect(clampName('Minh\r\nAnh')).toBe('Minh Anh');
    expect(clampName('e\u0323\u0302')).toBe('ệ');
  });
});

describe('sanitize', () => {
  const state = (size: number | null, slots: (string | null)[], message = '') => ({
    size,
    slots,
    message,
    from: '',
    to: '',
  });

  it('state hợp lệ giữ nguyên', () => {
    const s = state(6, ['01', '02', null, null, null, null], 'hi');
    expect(sanitize(s, CHOCOLATES, BOXES)).toEqual({ state: s, removedIds: [] });
  });
  it('loại id đã bị xóa khỏi catalog và id hết hàng', () => {
    const r = sanitize(state(6, ['01', 'gone', '04', '02', null, null]), CHOCOLATES, BOXES);
    expect(r.state.slots).toEqual(['01', null, null, '02', null, null]);
    expect(r.removedIds).toEqual(['gone', '04']);
  });
  it('size không có trong boxes → size null, slots rỗng, báo id bị loại', () => {
    const r = sanitize(
      state(7, ['01', null, '02', null, null, null, null], 'x'),
      CHOCOLATES,
      BOXES,
    );
    expect(r.state).toEqual({ size: null, slots: [], message: 'x', from: '', to: '' });
    expect(r.removedIds).toEqual(['01', '02']);
  });
  it('size null → slots rỗng', () => {
    expect(sanitize(state(null, ['01']), CHOCOLATES, BOXES).state.slots).toEqual([]);
  });
  it('sửa độ dài slots: dài quá bị cắt (báo id), ngắn quá được bù null', () => {
    const long = sanitize(
      state(6, ['01', null, null, null, null, null, '02', '03']),
      CHOCOLATES,
      BOXES,
    );
    expect(long.state.slots).toHaveLength(6);
    expect(long.removedIds).toEqual(['02', '03']);
    const short = sanitize(state(6, ['01']), CHOCOLATES, BOXES);
    expect(short.state.slots).toEqual(['01', null, null, null, null, null]);
  });
  it('cắt và chuẩn hóa lời nhắn', () => {
    const r = sanitize(state(6, [], 'a'.repeat(300)), CHOCOLATES, BOXES);
    expect(Array.from(r.state.message)).toHaveLength(MESSAGE_MAX);
  });
  it('cắt from/to và bỏ xuống dòng', () => {
    const r = sanitize(
      { ...state(6, []), from: 'a'.repeat(80), to: 'Lan\nAnh' },
      CHOCOLATES,
      BOXES,
    );
    expect(Array.from(r.state.from)).toHaveLength(NAME_MAX);
    expect(r.state.to).toBe('Lan Anh');
  });
  it('không đổi state đầu vào', () => {
    const s = state(6, ['gone', null, null, null, null, null]);
    sanitize(s, CHOCOLATES, BOXES);
    expect(s.slots[0]).toBe('gone');
  });
});
