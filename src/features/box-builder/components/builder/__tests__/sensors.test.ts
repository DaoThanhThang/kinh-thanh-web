import { afterEach, describe, expect, it, vi } from 'vitest';
import { LazyTouchSensor } from '../dnd/sensors';

afterEach(() => vi.restoreAllMocks());

/** Số listener touchmove KHÔNG passive đang gắn (ghi lại qua spy). */
function nonPassiveTouchMoves(spy: { mock: { calls: unknown[][] } }) {
  return spy.mock.calls.filter(([type, , opts]) => {
    const o = opts as AddEventListenerOptions | undefined;
    return type === 'touchmove' && typeof o === 'object' && o.passive === false;
  });
}

describe('LazyTouchSensor', () => {
  it('không gắn touchmove non-passive khi mount; chỉ gắn khi chạm phần tử kéo được', () => {
    const add = vi.spyOn(window, 'addEventListener');
    const remove = vi.spyOn(window, 'removeEventListener');
    const teardown = LazyTouchSensor.setup();
    expect(nonPassiveTouchMoves(add)).toHaveLength(0);

    const plain = document.createElement('div');
    document.body.append(plain);
    plain.dispatchEvent(new Event('touchstart', { bubbles: true }));
    expect(nonPassiveTouchMoves(add)).toHaveLength(0);

    const drag = document.createElement('button');
    drag.setAttribute('aria-roledescription', 'có thể kéo');
    document.body.append(drag);
    drag.dispatchEvent(new Event('touchstart', { bubbles: true }));
    expect(nonPassiveTouchMoves(add)).toHaveLength(1);

    drag.dispatchEvent(new Event('touchend', { bubbles: true }));
    expect(remove.mock.calls.some(([t]) => t === 'touchmove')).toBe(true);
    teardown?.();
    plain.remove();
    drag.remove();
  });
});
