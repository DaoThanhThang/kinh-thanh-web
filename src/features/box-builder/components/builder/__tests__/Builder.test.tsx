import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Chocolate } from '@/lib/schemas/chocolate';
import { BOXES, CHOCOLATES } from '../../../__tests__/fixtures';
import { BOX_STORAGE_KEY, useBoxStore } from '../../../store/useBoxStore';
import { useSelectionStore } from '../../../store/useSelectionStore';
import { Builder } from '../Builder';

const WITH_ALLERGENS: Chocolate[] = CHOCOLATES.map((c) =>
  c.id === '02' ? { ...c, allergens: ['sữa', 'hạt'] } : c,
);

async function setup(chocolates: readonly Chocolate[] = WITH_ALLERGENS) {
  render(<Builder chocolates={chocolates} boxes={BOXES} />);
  // Chờ hydrate xong và cỡ mặc định (12) được chọn.
  await screen.findByRole('radio', { name: /12 viên/, checked: true });
}

const addButton = (n: string) =>
  screen.getByRole('button', { name: `Thêm Chocolate ${n} vào hộp` });
/** Vùng aria-live của Builder (dnd-kit có thêm vùng role=status riêng). */
const live = () =>
  screen.getAllByRole('status').find((el) => el.id === 'builder-live') as HTMLElement;
const progress = (filled: number, cap: number) => screen.getByText(`Đã chọn ${filled}/${cap} viên`);

beforeEach(() => {
  window.localStorage.clear();
  useBoxStore.setState({ size: null, slots: [], message: '' });
  useSelectionStore.getState().reset();
});
afterEach(() => cleanup());

describe('Builder', () => {
  it('mặc định chọn hộp 12 viên với 12 ô trống', async () => {
    await setup();
    expect(progress(0, 12)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /còn trống/ })).toHaveLength(12);
  });

  it('thêm từ khay lấp vào ô trống đầu tiên và thông báo', async () => {
    await setup();
    fireEvent.click(addButton('01'));
    fireEvent.click(addButton('02'));
    expect(screen.getByRole('button', { name: /^Ô 1, Chocolate 01/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Ô 2, Chocolate 02/ })).toBeInTheDocument();
    expect(progress(2, 12)).toBeInTheDocument();
    expect(live()).toHaveTextContent('Đã thêm Chocolate 02 vào ô 2');
    expect(screen.getAllByText('×1', { selector: '.bt-badge' })).toHaveLength(2);
  });

  it('viên hết hàng bị vô hiệu hoá và ghi "Tạm hết"', async () => {
    await setup();
    const btn = screen.getByRole('button', { name: /Chocolate 04, Tạm hết/ });
    expect(btn).toBeDisabled();
    expect(btn).toHaveTextContent('Tạm hết');
  });

  it('hộp đầy thì khay được thay bằng bước "Hoàn tất" (T11)', async () => {
    await setup();
    fireEvent.click(screen.getByRole('radio', { name: /6 viên/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Chọn ngẫu nhiên phần còn lại' }));
    expect(useBoxStore.getState().slots).not.toContain(null);
    expect(screen.getByRole('heading', { name: 'Hoàn tất hộp quà' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Thêm Chocolate/ })).not.toBeInTheDocument();
    expect(live()).toHaveTextContent('Hộp đã đầy');
  });

  it('chọn ngẫu nhiên điền hết các ô còn trống (chỉ viên còn bán)', async () => {
    await setup();
    fireEvent.click(addButton('01'));
    fireEvent.click(screen.getByRole('button', { name: 'Chọn ngẫu nhiên phần còn lại' }));
    expect(screen.queryAllByRole('button', { name: /còn trống/ })).toHaveLength(0);
    expect(useBoxStore.getState().slots).toHaveLength(12);
    expect(useBoxStore.getState().slots).not.toContain('04');
    expect(useBoxStore.getState().slots[0]).toBe('01');
  });

  it('bỏ viên từ ô: mở menu rồi "Bỏ viên này"', async () => {
    await setup();
    fireEvent.click(addButton('03'));
    fireEvent.click(screen.getByRole('button', { name: /^Ô 1, Chocolate 03/ }));
    const menu = screen.getByRole('dialog', { name: 'Tuỳ chọn ô 1' });
    expect(within(menu).getByText('Chocolate 03')).toBeInTheDocument();
    fireEvent.click(within(menu).getByRole('button', { name: 'Bỏ viên này' }));
    expect(progress(0, 12)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Ô 1, còn trống/ })).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Tuỳ chọn ô 1' })).not.toBeInTheDocument();
  });

  describe('đổi cỡ hộp', () => {
    it('hộp chưa có viên bị bỏ thì đổi ngay, không hỏi', async () => {
      await setup();
      fireEvent.click(addButton('01'));
      fireEvent.click(screen.getByRole('radio', { name: /9 viên/ }));
      expect(screen.getByRole('radio', { name: /9 viên/, checked: true })).toBeInTheDocument();
      expect(document.querySelector('dialog[open]')).toBeNull();
      expect(progress(1, 9)).toBeInTheDocument();
    });

    it('có viên bị bỏ: hỏi xác nhận; giữ hộp thì không đổi, đồng ý thì dồn viên vào các ô đầu', async () => {
      await setup();
      fireEvent.click(screen.getByRole('button', { name: 'Chọn ngẫu nhiên phần còn lại' }));
      fireEvent.click(screen.getByRole('radio', { name: /6 viên/ }));

      const dialog = document.querySelector<HTMLElement>('dialog[open]');
      expect(dialog).not.toBeNull();
      expect(
        within(dialog as HTMLElement).getByText(
          'Hộp 6 viên chỉ giữ được 6 viên đầu. 6 viên sẽ được bỏ ra.',
        ),
      ).toBeInTheDocument();

      fireEvent.click(within(dialog as HTMLElement).getByText('Giữ hộp hiện tại'));
      expect(document.querySelector('dialog[open]')).toBeNull();
      expect(screen.getByRole('radio', { name: /12 viên/, checked: true })).toBeInTheDocument();
      expect(useBoxStore.getState().slots).toHaveLength(12);

      const before = useBoxStore.getState().slots.slice(0, 6);
      fireEvent.click(screen.getByRole('radio', { name: /6 viên/ }));
      const dialog2 = document.querySelector<HTMLElement>('dialog[open]') as HTMLElement;
      fireEvent.click(within(dialog2).getByText('Đổi hộp'));
      expect(screen.getByRole('radio', { name: /6 viên/, checked: true })).toBeInTheDocument();
      expect(useBoxStore.getState().slots).toEqual(before);
    });

    it('"Xoá hết" hỏi xác nhận trước khi xoá', async () => {
      await setup();
      fireEvent.click(addButton('01'));
      fireEvent.click(screen.getByRole('button', { name: 'Xoá hết' }));
      const dialog = document.querySelector<HTMLElement>('dialog[open]') as HTMLElement;
      expect(dialog).not.toBeNull();
      expect(progress(1, 12)).toBeInTheDocument();
      fireEvent.click(within(dialog).getByText('Xoá hết'));
      expect(progress(0, 12)).toBeInTheDocument();
    });
  });

  describe('chi tiết viên', () => {
    it('allergens null: ghi "Thông tin dị ứng đang cập nhật"', async () => {
      await setup();
      fireEvent.click(screen.getByRole('button', { name: 'Xem chi tiết Chocolate 01' }));
      expect(screen.getByText('Thông tin dị ứng đang cập nhật')).toBeInTheDocument();
    });

    it('allergens có dữ liệu: liệt kê', async () => {
      await setup();
      fireEvent.click(screen.getByRole('button', { name: 'Xem chi tiết Chocolate 02' }));
      expect(screen.getByText('Có chứa: sữa, hạt')).toBeInTheDocument();
      expect(screen.queryByText('Thông tin dị ứng đang cập nhật')).not.toBeInTheDocument();
    });
  });

  it('loại viên đã lưu không còn trong catalog và báo bằng vùng aria-live', async () => {
    window.localStorage.setItem(
      BOX_STORAGE_KEY,
      JSON.stringify({
        state: { size: 6, slots: ['01', 'zz', null, null, null, null], message: '' },
        version: 1,
      }),
    );
    render(<Builder chocolates={CHOCOLATES} boxes={BOXES} />);
    await screen.findByRole('radio', { name: /6 viên/, checked: true });
    await act(async () => {});
    expect(progress(1, 6)).toBeInTheDocument();
    expect(live()).toHaveTextContent(
      '1 viên đã lưu không còn trong danh mục nên đã được bỏ khỏi hộp.',
    );
  });

  describe('chạm-để-đặt', () => {
    const pick = (n: string) =>
      fireEvent.click(screen.getByRole('button', { name: `Cầm Chocolate ${n} để đặt vào hộp` }));
    const emptyCell = (n: number, name = 'Chocolate 03') =>
      screen.getByRole('button', { name: `Ô ${n}, còn trống. Chạm để đặt ${name}` });

    it('chạm viên trong khay → hiện thanh gợi ý, chạm ô trống để đặt, giữ viên để đặt tiếp, "Xong" thả', async () => {
      await setup();
      pick('03');
      expect(screen.getByText('Chạm vào ô trống để đặt Chocolate 03')).toBeInTheDocument();
      expect(live()).toHaveTextContent('Đang cầm Chocolate 03');
      expect(screen.getByRole('button', { name: 'Huỷ' })).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Đang cầm Chocolate 03. Bấm để bỏ chọn' }),
      ).toHaveAttribute('aria-pressed', 'true');

      fireEvent.click(emptyCell(1));
      expect(live()).toHaveTextContent('Đã thêm Chocolate 03 vào ô 1');
      fireEvent.click(emptyCell(2));
      expect(useBoxStore.getState().slots.slice(0, 3)).toEqual(['03', '03', null]);
      expect(screen.getByText('Chạm vào ô trống để đặt thêm Chocolate 03')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Xong' }));
      expect(screen.queryByText(/Chạm vào ô trống để đặt/)).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^Ô 3, còn trống$/ })).toBeInTheDocument();
    });

    it('"Huỷ" bỏ chọn khi chưa đặt viên nào; chạm lại thẻ cũng bỏ chọn', async () => {
      await setup();
      pick('03');
      fireEvent.click(screen.getByRole('button', { name: 'Huỷ' }));
      expect(screen.queryByText(/Chạm vào ô trống để đặt/)).not.toBeInTheDocument();
      expect(useBoxStore.getState().slots.every((x) => x === null)).toBe(true);
      pick('03');
      fireEvent.click(
        screen.getByRole('button', { name: 'Đang cầm Chocolate 03. Bấm để bỏ chọn' }),
      );
      expect(screen.queryByText(/Chạm vào ô trống để đặt/)).not.toBeInTheDocument();
    });

    it('hộp đầy thì tự bỏ chọn và thông báo', async () => {
      await setup();
      fireEvent.click(screen.getByRole('radio', { name: /6 viên/ }));
      for (const n of ['01', '02', '03', '01', '02']) fireEvent.click(addButton(n));
      pick('03');
      fireEvent.click(emptyCell(6));
      expect(useBoxStore.getState().slots).not.toContain(null);
      expect(screen.queryByText(/Chạm vào ô trống để đặt/)).not.toBeInTheDocument();
      expect(live()).toHaveTextContent('Hộp đã đầy');
    });

    it('chạm ô đã có viên khi đang cầm: menu có "Thay bằng …", bấm thì thay và thông báo', async () => {
      await setup();
      fireEvent.click(addButton('01'));
      pick('03');
      fireEvent.click(screen.getByRole('button', { name: /^Ô 1, Chocolate 01/ }));
      const menu = screen.getByRole('dialog', { name: 'Tuỳ chọn ô 1' });
      fireEvent.click(within(menu).getByRole('button', { name: 'Thay bằng Chocolate 03' }));
      expect(useBoxStore.getState().slots[0]).toBe('03');
      expect(live()).toHaveTextContent('Đã thay Chocolate 01 bằng Chocolate 03 ở ô 1');
      // vẫn đang cầm để đặt tiếp
      expect(screen.getByText(/Chạm vào ô trống để đặt/)).toBeInTheDocument();
    });

    it('menu không đề nghị thay bằng chính loại đang có', async () => {
      await setup();
      fireEvent.click(addButton('03'));
      pick('03');
      fireEvent.click(screen.getByRole('button', { name: /^Ô 1, Chocolate 03/ }));
      const menu = screen.getByRole('dialog', { name: 'Tuỳ chọn ô 1' });
      expect(within(menu).queryByText(/Thay bằng/)).not.toBeInTheDocument();
      expect(within(menu).getByRole('button', { name: 'Bỏ viên này' })).toBeInTheDocument();
    });

    it('chọn ô trống trước: thẻ khay đổi thành "Đặt vào ô N", chạm thẻ đặt vào ô đó', async () => {
      await setup();
      fireEvent.click(screen.getByRole('button', { name: /^Ô 3, còn trống$/ }));
      expect(screen.getByRole('button', { name: /^Ô 3, còn trống, đang chọn$/ })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      expect(live()).toHaveTextContent('Đã chọn ô 3');
      const place = screen.getByRole('button', { name: 'Đặt Chocolate 02 vào ô 3' });
      expect(place).toHaveTextContent('Đặt vào ô 3');
      fireEvent.click(place);
      expect(useBoxStore.getState().slots[2]).toBe('02');
      expect(live()).toHaveTextContent('Đã thêm Chocolate 02 vào ô 3');
      // đã đặt: bỏ chọn ô, nút về "Thêm"
      expect(addButton('02')).toHaveTextContent('Thêm');
    });

    it('chọn ô trống trước rồi chạm ảnh thẻ cũng đặt vào ô', async () => {
      await setup();
      fireEvent.click(screen.getByRole('button', { name: /^Ô 2, còn trống$/ }));
      fireEvent.click(screen.getByRole('button', { name: 'Chọn Chocolate 03, đặt vào ô 2' }));
      expect(useBoxStore.getState().slots[1]).toBe('03');
    });

    it('"Thêm" vẫn đặt vào ô trống đầu tiên khi đang cầm viên khác', async () => {
      await setup();
      pick('03');
      fireEvent.click(addButton('02'));
      expect(useBoxStore.getState().slots[0]).toBe('02');
      expect(screen.getByText(/Chạm vào ô trống để đặt/)).toBeInTheDocument();
    });
  });
});
