import { beforeEach, describe, expect, it } from 'vitest';
import { useSelectionStore } from '../store/useSelectionStore';

const s = () => useSelectionStore.getState();

beforeEach(() => s().reset());

describe('useSelectionStore', () => {
  it('bắt đầu rỗng', () => {
    expect(s()).toMatchObject({ held: null, placed: 0, cell: null });
  });

  it('cầm viên; bấm lại đúng viên thì thả; cầm viên khác thì đổi và đếm lại', () => {
    s().toggleHold('03');
    expect(s().held).toBe('03');
    s().notePlaced();
    s().notePlaced();
    expect(s().placed).toBe(2);
    s().toggleHold('05');
    expect(s()).toMatchObject({ held: '05', placed: 0 });
    s().toggleHold('05');
    expect(s().held).toBeNull();
  });

  it('release thả viên và đặt lại bộ đếm', () => {
    s().toggleHold('03');
    s().notePlaced();
    s().release();
    expect(s()).toMatchObject({ held: null, placed: 0 });
  });

  it('chọn ô và cầm viên loại trừ nhau', () => {
    s().toggleCell(4);
    expect(s().cell).toBe(4);
    s().toggleHold('03');
    expect(s()).toMatchObject({ held: '03', cell: null });
    s().toggleCell(2);
    expect(s()).toMatchObject({ held: null, cell: 2 });
  });

  it('bấm lại ô đang chọn (hoặc null) thì bỏ chọn', () => {
    s().toggleCell(4);
    s().toggleCell(4);
    expect(s().cell).toBeNull();
    s().toggleCell(1);
    s().toggleCell(null);
    expect(s().cell).toBeNull();
    s().toggleCell(1);
    s().clearCell();
    expect(s().cell).toBeNull();
  });
});
