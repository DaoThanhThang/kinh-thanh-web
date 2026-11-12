import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CHOCOLATES } from '../../box-builder/__tests__/fixtures';
import { CatalogTray } from '../components/CatalogTray';

const mockWide = (matches: boolean) =>
  vi.stubGlobal('matchMedia', (q: string) => ({
    matches: q.includes('64rem') ? matches : false,
    media: q,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));

const tray = () =>
  render(
    <CatalogTray
      chocolates={CHOCOLATES}
      counts={{}}
      full={false}
      heldId={null}
      selectedCell={null}
      dragId={(id) => `tray:${id}`}
      onAdd={() => undefined}
      onPick={() => undefined}
      onPlaceInCell={() => undefined}
      onDetails={() => undefined}
    />,
  );

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('khay: vùng cuộn bên trong (R3)', () => {
  it('desktop (>= 64rem): có vùng cuộn và gợi ý số viên', () => {
    mockWide(true);
    const { container } = tray();
    expect(container.querySelector('[data-tray-scroll="true"]')).not.toBeNull();
    expect(container.querySelector('.bt-scroll-hint')?.textContent).toBe(
      `${CHOCOLATES.length} viên · cuộn để xem thêm`,
    );
  });

  it('mobile (< 64rem): không có vùng cuộn lồng, không có gợi ý', () => {
    mockWide(false);
    const { container } = tray();
    expect(container.querySelector('[data-tray-scroll]')).toBeNull();
    expect(container.querySelector('.bt-scroll-hint')).toBeNull();
  });
});
