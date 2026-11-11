import { describe, expect, it } from 'vitest';
import {
  TRAY_ZONE_ID,
  cellDndId,
  parseSource,
  parseTarget,
  resolveDrop,
  trayItemId,
} from '../model/drop';
import type { Slots } from '../model/types';

const slots: Slots = ['01', null, '03', null, null, null];

describe('id dnd-kit', () => {
  it('tạo và đọc lại id khay / ô', () => {
    expect(parseSource(trayItemId('07'))).toEqual({ type: 'tray', chocolateId: '07' });
    expect(parseSource(cellDndId(4))).toEqual({ type: 'cell', index: 4 });
    expect(parseTarget(TRAY_ZONE_ID)).toEqual({ type: 'tray' });
    expect(parseTarget(cellDndId(0))).toEqual({ type: 'cell', index: 0 });
  });
  it('id lạ hoặc hỏng → null', () => {
    expect(parseSource('x')).toBeNull();
    expect(parseSource('cell:-1')).toBeNull();
    expect(parseSource('cell:abc')).toBeNull();
    expect(parseSource('tray:')).toBeNull();
    expect(parseSource(3)).toBeNull();
    expect(parseTarget(null)).toBeNull();
    expect(parseTarget(trayItemId('01'))).toBeNull();
  });
});

describe('resolveDrop', () => {
  it('khay → ô trống: đặt', () => {
    expect(resolveDrop(trayItemId('05'), cellDndId(1), slots)).toEqual({
      kind: 'place',
      index: 1,
      id: '05',
      replaced: null,
    });
  });

  it('khay → ô có viên: thay, nhớ viên bị thay', () => {
    expect(resolveDrop(trayItemId('05'), cellDndId(2), slots)).toEqual({
      kind: 'place',
      index: 2,
      id: '05',
      replaced: '03',
    });
  });

  it('khay → ô đã đúng loại đó: không đổi gì', () => {
    expect(resolveDrop(trayItemId('03'), cellDndId(2), slots)).toEqual({ kind: 'none' });
  });

  it('khay → ngoài hộp / vùng khay / ô ngoài phạm vi / viên hết hàng: không làm gì', () => {
    expect(resolveDrop(trayItemId('05'), null, slots)).toEqual({ kind: 'none' });
    expect(resolveDrop(trayItemId('05'), TRAY_ZONE_ID, slots)).toEqual({ kind: 'none' });
    expect(resolveDrop(trayItemId('05'), cellDndId(99), slots)).toEqual({ kind: 'none' });
    expect(resolveDrop(trayItemId('05'), cellDndId(1), slots, () => false)).toEqual({
      kind: 'none',
    });
  });

  it('ô → ô có viên: đổi chỗ', () => {
    expect(resolveDrop(cellDndId(0), cellDndId(2), slots)).toEqual({
      kind: 'swap',
      from: 0,
      to: 2,
      moved: '01',
      displaced: '03',
    });
  });

  it('ô → ô trống: chuyển (swap với displaced null)', () => {
    expect(resolveDrop(cellDndId(0), cellDndId(4), slots)).toEqual({
      kind: 'swap',
      from: 0,
      to: 4,
      moved: '01',
      displaced: null,
    });
  });

  it('ô → chính nó: không làm gì', () => {
    expect(resolveDrop(cellDndId(0), cellDndId(0), slots)).toEqual({ kind: 'none' });
  });

  it('ô → ngoài hộp hoặc vùng khay: bỏ viên', () => {
    expect(resolveDrop(cellDndId(2), null, slots)).toEqual({
      kind: 'remove',
      index: 2,
      id: '03',
    });
    expect(resolveDrop(cellDndId(2), TRAY_ZONE_ID, slots)).toEqual({
      kind: 'remove',
      index: 2,
      id: '03',
    });
  });

  it('nguồn là ô trống hoặc ngoài phạm vi: không làm gì', () => {
    expect(resolveDrop(cellDndId(1), null, slots)).toEqual({ kind: 'none' });
    expect(resolveDrop(cellDndId(40), null, slots)).toEqual({ kind: 'none' });
    expect(resolveDrop('lạ', cellDndId(0), slots)).toEqual({ kind: 'none' });
  });

  it('kết quả áp dụng bằng logic hiện có cho ra hộp đúng', async () => {
    const { placeAt, swap, removeAt } = await import('../model/box-logic');
    const place = resolveDrop(trayItemId('05'), cellDndId(2), slots);
    if (place.kind !== 'place') throw new Error('expected place');
    expect(placeAt(slots, place.index, place.id)[2]).toBe('05');
    const sw = resolveDrop(cellDndId(0), cellDndId(4), slots);
    if (sw.kind !== 'swap') throw new Error('expected swap');
    expect(swap(slots, sw.from, sw.to)).toEqual([null, null, '03', null, '01', null]);
    const rm = resolveDrop(cellDndId(0), null, slots);
    if (rm.kind !== 'remove') throw new Error('expected remove');
    expect(removeAt(slots, rm.index)[0]).toBeNull();
  });
});
