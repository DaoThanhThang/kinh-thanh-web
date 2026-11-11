import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BOXES, CHOCOLATES } from '../../../__tests__/fixtures';
import { BOX_STORAGE_KEY, useBoxStore } from '../../../store/useBoxStore';
import { useSelectionStore } from '../../../store/useSelectionStore';
import { Builder } from '../Builder';

const FULL6 = ['01', '02', '03', '01', '02', '03'];

async function setup() {
  render(<Builder chocolates={CHOCOLATES} boxes={BOXES} />);
  await screen.findByRole('radio', { name: /12 viên/, checked: true });
  fireEvent.click(screen.getByRole('radio', { name: /6 viên/ }));
}

/** Bấm "Chọn ngẫu nhiên" khi đã bật giả lập thời gian. */
function fillBox() {
  fireEvent.click(screen.getByRole('button', { name: 'Chọn ngẫu nhiên phần còn lại' }));
}

const stage = () => document.querySelector('.bb-stage') as HTMLElement;
const ribbon = () => document.querySelector('.gb-ribbon');
const tick = (ms: number) => act(() => void vi.advanceTimersByTime(ms));
const mockReducedMotion = (matches: boolean) =>
  vi.stubGlobal('matchMedia', (q: string) => ({
    matches,
    media: q,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));

beforeEach(() => {
  window.localStorage.clear();
  useBoxStore.setState({ size: null, slots: [], message: '', from: '', to: '' });
  useSelectionStore.getState().reset();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('bước Hoàn tất (T11)', () => {
  it('đầy → đóng nắp → thắt ruy băng → hiện thiệp', async () => {
    await setup();
    vi.useFakeTimers();
    fillBox();

    // closing: bước hiện ra, hộp khoá (inert), chưa có ruy băng và chưa có thiệp
    expect(screen.getByRole('heading', { name: 'Hoàn tất hộp quà' })).toBeInTheDocument();
    expect(stage()).toHaveAttribute('data-closed', 'true');
    expect(stage()).toHaveAttribute('inert');
    expect(ribbon()).toBeNull();
    expect(screen.queryByRole('textbox', { name: /Lời nhắn/ })).not.toBeInTheDocument();

    tick(1200);
    expect(ribbon()).toHaveAttribute('data-state', 'tying');
    expect(screen.queryByRole('textbox', { name: /Lời nhắn/ })).not.toBeInTheDocument();

    tick(900);
    expect(ribbon()).toHaveAttribute('data-state', 'tied');
    expect(screen.getByRole('textbox', { name: /Lời nhắn/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Tiếp tục đặt hàng' })).toHaveAttribute(
      'href',
      '/dat-hang',
    );
    expect(document.getElementById('builder-live')).toHaveTextContent(/thắt ruy băng/);
  });

  it('prefers-reduced-motion: các pha chuyển ngay, không chờ hoạt ảnh', async () => {
    mockReducedMotion(true);
    await setup();
    vi.useFakeTimers();
    fillBox();
    tick(1);
    tick(1);
    expect(ribbon()).toHaveAttribute('data-state', 'tied');
    expect(screen.getByRole('textbox', { name: /Lời nhắn/ })).toBeInTheDocument();
  });

  it('lời nhắn, gửi đến, gửi từ: lưu vào store, đếm ký tự, xem trước trên thiệp', async () => {
    mockReducedMotion(true);
    await setup();
    vi.useFakeTimers();
    fillBox();
    tick(1);
    tick(1);

    const box = screen.getByRole('textbox', { name: /Lời nhắn/ });
    fireEvent.change(box, { target: { value: 'Chúc mừng sinh nhật' } });
    expect(useBoxStore.getState().message).toBe('Chúc mừng sinh nhật');
    expect(screen.getByText('19/150')).toBeInTheDocument();
    const card = screen.getByRole('figure', { name: 'Xem trước thiệp' });
    expect(card).toHaveTextContent('Chúc mừng sinh nhật');

    fireEvent.change(box, { target: { value: 'x'.repeat(200) } });
    expect(Array.from(useBoxStore.getState().message)).toHaveLength(150);
    expect(screen.getByText('150/150')).toBeInTheDocument();

    fireEvent.change(screen.getByRole('textbox', { name: 'Gửi đến' }), {
      target: { value: 'Lan' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Gửi từ' }), {
      target: { value: 'M'.repeat(60) },
    });
    expect(useBoxStore.getState().to).toBe('Lan');
    expect(Array.from(useBoxStore.getState().from)).toHaveLength(40);
    expect(card).toHaveTextContent('Gửi đến Lan');
    expect(card).toHaveTextContent(`Gửi từ ${'M'.repeat(40)}`);
  });

  it('bỏ một viên (hộp hết đầy) → tự quay về chế độ sửa', async () => {
    mockReducedMotion(true);
    await setup();
    vi.useFakeTimers();
    fillBox();
    tick(1);
    tick(1);
    expect(ribbon()).not.toBeNull();

    act(() => useBoxStore.getState().removeAt(0));
    expect(screen.queryByRole('heading', { name: 'Hoàn tất hộp quà' })).not.toBeInTheDocument();
    expect(ribbon()).toBeNull();
    expect(stage()).not.toHaveAttribute('data-closed');
    expect(screen.getByRole('button', { name: 'Thêm Chocolate 01 vào hộp' })).toBeInTheDocument();
  });

  it('"Mở hộp để sửa": nắp mở, ruy băng gỡ, không mất dữ liệu và không tự đóng lại', async () => {
    await setup();
    vi.useFakeTimers();
    fillBox();
    tick(1200);
    tick(900);
    fireEvent.change(screen.getByRole('textbox', { name: /Lời nhắn/ }), {
      target: { value: 'Giữ lời nhắn' },
    });
    const slotsBefore = [...useBoxStore.getState().slots];

    fireEvent.click(screen.getByRole('button', { name: 'Mở hộp để sửa' }));
    expect(ribbon()).toHaveAttribute('data-state', 'untying');
    expect(stage()).not.toHaveAttribute('data-closed');
    expect(stage()).toHaveAttribute('inert'); // vẫn khoá trong lúc nắp đang mở

    tick(1200);
    expect(ribbon()).toBeNull();
    expect(stage()).not.toHaveAttribute('inert');
    expect(screen.getAllByRole('button', { name: /Thêm Chocolate/ }).length).toBeGreaterThan(0);
    expect(useBoxStore.getState().slots).toEqual(slotsBefore);
    expect(useBoxStore.getState().message).toBe('Giữ lời nhắn');

    // hộp vẫn đầy nhưng người dùng đang sửa: không tự đóng lại
    tick(5000);
    expect(screen.queryByRole('heading', { name: 'Hoàn tất hộp quà' })).not.toBeInTheDocument();

    // bỏ một viên rồi đặt lại → đầy lần nữa → đóng lại
    act(() => useBoxStore.getState().removeAt(0));
    act(() => void useBoxStore.getState().placeInFirstEmpty('01'));
    expect(screen.getByRole('heading', { name: 'Hoàn tất hộp quà' })).toBeInTheDocument();
    expect(stage()).toHaveAttribute('data-closed', 'true');
  });

  it('hộp đã đầy từ lần trước: vào thẳng thiệp, không chạy lại hoạt ảnh', async () => {
    window.localStorage.setItem(
      BOX_STORAGE_KEY,
      JSON.stringify({
        state: { size: 6, slots: FULL6, message: 'Đã lưu', from: 'A', to: 'B' },
        version: 1,
      }),
    );
    render(<Builder chocolates={CHOCOLATES} boxes={BOXES} />);
    const box = await screen.findByRole('textbox', { name: /Lời nhắn/ });
    expect(box).toHaveValue('Đã lưu');
    expect(stage()).toHaveAttribute('data-instant', 'true');
    expect(ribbon()).toHaveAttribute('data-state', 'tied');
  });
});
