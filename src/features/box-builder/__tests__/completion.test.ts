import { describe, expect, it } from 'vitest';
import {
  completionReducer as reduce,
  initialCompletion,
  type CompletionEvent,
  type CompletionState,
} from '../model/completion';

const run = (events: CompletionEvent[], from: CompletionState = initialCompletion) =>
  events.reduce(reduce, from);

describe('completionReducer', () => {
  it('đầy → closing → tying → ready', () => {
    expect(run([{ type: 'full' }]).phase).toBe('closing');
    expect(run([{ type: 'full' }, { type: 'lidClosed' }]).phase).toBe('tying');
    expect(run([{ type: 'full' }, { type: 'lidClosed' }, { type: 'ribbonTied' }]).phase).toBe(
      'ready',
    );
  });

  it('sự kiện sai thứ tự bị bỏ qua', () => {
    expect(run([{ type: 'ribbonTied' }]).phase).toBe('edit');
    expect(run([{ type: 'lidClosed' }]).phase).toBe('edit');
    expect(run([{ type: 'full' }, { type: 'ribbonTied' }]).phase).toBe('closing');
  });

  it('hộp đã đầy khi tải trang → ready ngay, không hoạt ảnh (instant)', () => {
    const s = run([{ type: 'full', onLoad: true }]);
    expect(s).toEqual({ phase: 'ready', reopened: false, instant: true });
  });

  it('bỏ viên (hết đầy) ở bất kỳ pha nào → về edit', () => {
    for (const events of [
      [{ type: 'full' }],
      [{ type: 'full' }, { type: 'lidClosed' }],
      [{ type: 'full' }, { type: 'lidClosed' }, { type: 'ribbonTied' }],
      [{ type: 'full', onLoad: true }],
    ] as CompletionEvent[][]) {
      expect(run([...events, { type: 'notFull' }])).toEqual(initialCompletion);
    }
  });

  it('mở hộp để sửa: opening → edit, và không tự đóng lại khi vẫn đầy', () => {
    const ready = run([{ type: 'full' }, { type: 'lidClosed' }, { type: 'ribbonTied' }]);
    const opening = reduce(ready, { type: 'reopen' });
    expect(opening.phase).toBe('opening');
    const edit = reduce(opening, { type: 'lidOpened' });
    expect(edit.phase).toBe('edit');
    // hộp vẫn đầy: không đóng lại
    expect(reduce(edit, { type: 'full' }).phase).toBe('edit');
    // hết đầy rồi đầy lại → đóng
    expect(run([{ type: 'notFull' }, { type: 'full' }], edit).phase).toBe('closing');
  });

  it('reopen khi đang edit là không làm gì; reopen giữa chừng (closing) được', () => {
    expect(reduce(initialCompletion, { type: 'reopen' })).toBe(initialCompletion);
    expect(run([{ type: 'full' }, { type: 'reopen' }]).phase).toBe('opening');
  });

  it('reopen từ trạng thái nhảy-thẳng bỏ cờ instant', () => {
    const s = run([{ type: 'full', onLoad: true }, { type: 'reopen' }]);
    expect(s).toEqual({ phase: 'opening', reopened: true, instant: false });
  });
});
