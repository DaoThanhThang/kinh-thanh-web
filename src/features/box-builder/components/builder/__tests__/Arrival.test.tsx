import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BOXES, CHOCOLATES } from '../../../__tests__/fixtures';
import { BOX_STORAGE_KEY, useBoxStore } from '../../../store/useBoxStore';
import { useSelectionStore } from '../../../store/useSelectionStore';
import { Builder } from '../Builder';

/** IntersectionObserver giả: ghi lại callback để test tự bắn sự kiện. */
type Observer = { cb: IntersectionObserverCallback; opts?: IntersectionObserverInit };
let observers: Observer[] = [];

function mockIntersection() {
  observers = [];
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(cb: IntersectionObserverCallback, opts?: IntersectionObserverInit) {
        observers.push({ cb, opts });
      }
      observe() {}
      disconnect() {}
      unobserve() {}
    },
  );
}

/** Báo "hộp đã vào khung nhìn" cho observer có ngưỡng 0.35 (observer của hiệu ứng mở nắp). */
function arrive() {
  const o = observers.find((x) => x.opts?.threshold === 0.35);
  expect(o).toBeDefined();
  act(() =>
    o!.cb(
      [{ isIntersecting: true, intersectionRatio: 0.4 } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    ),
  );
}

const stage = () => document.querySelector('.bb-stage') as HTMLElement;

async function mount() {
  render(<Builder chocolates={CHOCOLATES} boxes={BOXES} />);
  await screen.findByRole('radio', { name: /12 viên/, checked: true });
}

beforeEach(() => {
  window.localStorage.clear();
  useBoxStore.setState({ size: null, slots: [], message: '', from: '', to: '' });
  useSelectionStore.getState().reset();
  mockIntersection();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('hộp builder mở nắp khi tới nơi (D42)', () => {
  it('vừa tới: nắp đóng, khay khoá; vào khung nhìn thì mở nắp rồi dùng được', async () => {
    await mount();
    expect(stage()).toHaveAttribute('data-closed', 'true');
    expect(stage()).toHaveAttribute('inert');
    expect(stage()).not.toHaveAttribute('data-instant');

    arrive();
    // Đang mở: nắp không còn đóng, đang chuyển tiếp 1400ms, khay vẫn khoá.
    expect(stage()).not.toHaveAttribute('data-closed');
    expect(stage()).toHaveAttribute('data-arrival', 'opening');
    expect(stage()).toHaveAttribute('inert');
    expect(
      (document.querySelector('.bb-box') as HTMLElement).style.getPropertyValue('--open'),
    ).toBe('1');

    await waitFor(() => expect(stage()).not.toHaveAttribute('inert'), { timeout: 3000 });
    expect(stage()).not.toHaveAttribute('data-arrival');
  });

  it('chưa vào khung nhìn thì nắp vẫn đóng', async () => {
    await mount();
    expect(stage()).toHaveAttribute('data-closed', 'true');
    expect(stage()).toHaveAttribute('inert');
  });

  it('hộp đã có viên (quay lại): mở sẵn, không hoạt ảnh', async () => {
    window.localStorage.setItem(
      BOX_STORAGE_KEY,
      JSON.stringify({
        state: { size: 12, slots: ['01', ...Array(11).fill(null)], message: '', from: '', to: '' },
        version: 1,
      }),
    );
    await mount();
    expect(stage()).not.toHaveAttribute('data-closed');
    expect(stage()).not.toHaveAttribute('inert');
    expect(stage()).toHaveAttribute('data-instant', 'true');
    expect(stage()).not.toHaveAttribute('data-arrival');
  });

  it('giảm chuyển động: mở sẵn, không hoạt ảnh', async () => {
    vi.stubGlobal('matchMedia', (q: string) => ({
      matches: q.includes('prefers-reduced-motion'),
      media: q,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }));
    await mount();
    expect(stage()).not.toHaveAttribute('data-closed');
    expect(stage()).not.toHaveAttribute('inert');
    expect(stage()).toHaveAttribute('data-instant', 'true');
  });
});
