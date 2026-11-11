import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BOXES, CHOCOLATES } from '@/features/box-builder/__tests__/fixtures';
import { BOX_STORAGE_KEY, useBoxStore } from '@/features/box-builder';
import type { OrderPayload } from '@/lib/schemas/order';
import type { OrderResult, OrderService } from '@/lib/services/order';
import { buildOrderPayload, groupPieces, isBoxComplete } from '../model/payload';
import { CheckoutPage } from '../components/CheckoutPage';

const FULL6 = ['01', '02', '03', '01', '02', '03'];

const seed = (over: Record<string, unknown> = {}) =>
  window.localStorage.setItem(
    BOX_STORAGE_KEY,
    JSON.stringify({
      state: { size: 6, slots: FULL6, message: 'Chúc mừng', from: 'Minh', to: 'Lan', ...over },
      version: 1,
    }),
  );

function fakeService(results: OrderResult[]) {
  const calls: OrderPayload[] = [];
  const service: OrderService = {
    submitOrder: vi.fn(async (p: OrderPayload): Promise<OrderResult> => {
      calls.push(p);
      return results.shift() ?? { ok: true, orderId: 'KT-TEST-0001' };
    }),
  };
  return { service, calls };
}

const renderPage = (service: OrderService) =>
  render(<CheckoutPage chocolates={CHOCOLATES} boxes={BOXES} service={service} />);

const fillValid = () => {
  fireEvent.change(screen.getByLabelText(/Họ tên/), { target: { value: 'Nguyễn Văn An' } });
  fireEvent.change(screen.getByLabelText(/Số điện thoại/), { target: { value: '0912.345.678' } });
  fireEvent.change(screen.getByLabelText(/Địa chỉ giao hàng/), {
    target: { value: '12 Phố Huế, Hai Bà Trưng' },
  });
  fireEvent.change(screen.getByLabelText(/Tỉnh/), { target: { value: 'Hà Nội' } });
};

const submit = () => fireEvent.click(screen.getByRole('button', { name: /Gửi đơn hàng|Gửi lại/ }));

beforeEach(() => {
  window.localStorage.clear();
  useBoxStore.setState({ size: null, slots: [], message: '', from: '', to: '' });
});
afterEach(() => cleanup());

describe('model/payload', () => {
  it('gom viên theo loại, kiểm tra hộp đầy, dựng payload', () => {
    expect(groupPieces(FULL6, CHOCOLATES)).toEqual([
      { id: '01', name: 'Chocolate 01', qty: 2, unitPrice: 35000 },
      { id: '02', name: 'Chocolate 02', qty: 2, unitPrice: 40000 },
      { id: '03', name: 'Chocolate 03', qty: 2, unitPrice: 45000 },
    ]);
    const box = { size: 6, slots: FULL6, message: 'hi', from: 'A', to: 'B' };
    expect(isBoxComplete(box, BOXES)).toBe(true);
    expect(isBoxComplete({ ...box, slots: ['01', null, '02', '03', '01', '02'] }, BOXES)).toBe(
      false,
    );
    expect(isBoxComplete({ ...box, size: null }, BOXES)).toBe(false);
    const payload = buildOrderPayload({
      customer: {
        name: 'An',
        phone: '0912345678',
        email: undefined,
        address: 'x',
        province: 'y',
        desiredDate: undefined,
        note: undefined,
        payment: 'cod',
      },
      box,
      chocolates: CHOCOLATES,
      boxes: BOXES,
      now: new Date('2026-11-11T08:00:00Z'),
    });
    expect(payload.customer).not.toHaveProperty('email');
    expect(payload.box.slots).toEqual(FULL6);
    expect(payload.card).toEqual({ message: 'hi', from: 'A', to: 'B' });
    expect(payload.pricing.pieces).toBe(2 * (35000 + 40000 + 45000));
    expect(payload.pricing.total).toBe(payload.pricing.box + payload.pricing.pieces);
  });
});

describe('Trang đặt hàng', () => {
  it('hộp chưa đầy → trạng thái rỗng nhẹ nhàng, link về #builder', async () => {
    seed({ slots: ['01', null, null, null, null, null] });
    const { service } = fakeService([]);
    renderPage(service);
    expect(
      await screen.findByRole('heading', { name: 'Hộp của bạn chưa đầy' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/mới có 1 viên/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Quay lại xếp hộp' })).toHaveAttribute(
      'href',
      '/#builder',
    );
    expect(screen.queryByRole('button', { name: 'Gửi đơn hàng' })).not.toBeInTheDocument();
  });

  it('chưa có hộp nào → trạng thái rỗng', async () => {
    renderPage(fakeService([]).service);
    expect(
      await screen.findByRole('heading', { name: 'Hộp của bạn chưa đầy' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/chưa xếp hộp quà nào/)).toBeInTheDocument();
  });

  it('hộp đầy: tóm tắt đơn có viên theo loại, lời nhắn và giá', async () => {
    seed();
    renderPage(fakeService([]).service);
    await screen.findByRole('heading', { name: 'Thông tin giao hàng' });
    expect(screen.getByText('Chocolate 01 × 2')).toBeInTheDocument();
    expect(screen.getByText('Chocolate 03 × 2')).toBeInTheDocument();
    expect(screen.getByText('Chúc mừng')).toBeInTheDocument();
    expect(screen.getByText('Gửi đến Lan')).toBeInTheDocument();
    expect(screen.getByText('Gửi từ Minh')).toBeInTheDocument();
    // 120.000 (hộp 6) + 2 × (35.000 + 40.000 + 45.000)
    expect(screen.getByText('360.000 ₫')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Quay lại sửa hộp' })).toHaveAttribute(
      'href',
      '/#builder',
    );
  });

  it('gửi form rỗng: lỗi nêu vấn đề + cách sửa, aria-invalid, focus ô sai đầu tiên, không gọi service', async () => {
    seed();
    const { service } = fakeService([]);
    renderPage(service);
    await screen.findByRole('heading', { name: 'Thông tin giao hàng' });
    submit();

    const name = screen.getByLabelText(/Họ tên/);
    expect(name).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Hãy nhập họ tên người đặt.')).toBeInTheDocument();
    expect(name.getAttribute('aria-describedby')).toBe('co-name-err');
    expect(document.activeElement).toBe(name);
    expect(screen.getByLabelText(/Địa chỉ giao hàng/)).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText(/Tỉnh/)).toHaveAttribute('aria-invalid', 'true');
    expect(service.submitOrder).not.toHaveBeenCalled();
  });

  it('số điện thoại sai: nhắc "10 chữ số, bắt đầu bằng 0"; sửa xong thì hết lỗi', async () => {
    seed();
    renderPage(fakeService([]).service);
    await screen.findByRole('heading', { name: 'Thông tin giao hàng' });
    const phone = screen.getByLabelText(/Số điện thoại/);
    fireEvent.change(phone, { target: { value: '12345' } });
    fireEvent.blur(phone);
    expect(screen.getByText('Số điện thoại cần 10 chữ số, bắt đầu bằng 0.')).toBeInTheDocument();
    expect(phone).toHaveAttribute('aria-invalid', 'true');
    fireEvent.change(phone, { target: { value: '0912 345 678' } });
    expect(screen.queryByText(/Số điện thoại cần 10 chữ số/)).not.toBeInTheDocument();
    expect(phone).not.toHaveAttribute('aria-invalid');
  });

  it('email sai và ngày quá khứ bị báo; chọn chuyển khoản hiện ghi chú, không bịa số tài khoản', async () => {
    seed();
    renderPage(fakeService([]).service);
    await screen.findByRole('heading', { name: 'Thông tin giao hàng' });
    const email = screen.getByLabelText(/Email/);
    fireEvent.change(email, { target: { value: 'abc' } });
    fireEvent.blur(email);
    expect(screen.getByText(/Email chưa đúng dạng/)).toBeInTheDocument();
    const date = screen.getByLabelText(/Ngày nhận mong muốn/);
    fireEvent.change(date, { target: { value: '2020-01-01' } });
    fireEvent.blur(date);
    expect(screen.getByText(/từ ngày mai trở đi/, { selector: 'p.co-error' })).toBeInTheDocument();

    expect(screen.queryByText(/Hướng dẫn chuyển khoản/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('radio', { name: 'Chuyển khoản' }));
    expect(screen.getByText(/Hướng dẫn chuyển khoản sẽ được gửi sau khi/)).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /COD/ })).not.toBeChecked();
  });

  it('gửi thành công: payload chuẩn hoá, màn hình cảm ơn có mã đơn, rồi mới xoá hộp', async () => {
    seed();
    const { service, calls } = fakeService([{ ok: true, orderId: 'KT-20261111-0482' }]);
    renderPage(service);
    await screen.findByRole('heading', { name: 'Thông tin giao hàng' });
    fillValid();
    submit();

    expect(await screen.findByText('KT-20261111-0482')).toBeInTheDocument();
    expect(screen.getByText('Kinh Thành sẽ liên hệ để xác nhận đơn.')).toBeInTheDocument();
    expect(screen.queryByRole('form')).not.toBeInTheDocument();

    expect(calls).toHaveLength(1);
    expect(calls[0]?.customer.phone).toBe('0912345678');
    expect(calls[0]?.customer.payment).toBe('cod');
    expect(calls[0]?.card).toEqual({ message: 'Chúc mừng', from: 'Minh', to: 'Lan' });
    expect(calls[0]?.pricing.total).toBe(360000);

    // store bị xoá sau khi màn hình thành công đã vẽ, và state lưu cũng sạch
    await waitFor(() => expect(useBoxStore.getState().slots).toEqual([]));
    expect(useBoxStore.getState().size).toBeNull();
    expect(useBoxStore.getState().message).toBe('');
    expect(useBoxStore.getState().from).toBe('');
    const saved = JSON.parse(window.localStorage.getItem(BOX_STORAGE_KEY) ?? '{}') as {
      state?: { slots?: unknown[] };
    };
    expect(saved.state?.slots).toEqual([]);
    // vẫn đang ở màn hình cảm ơn (không bị đẩy sang trạng thái "hộp chưa đầy")
    expect(screen.getByText('KT-20261111-0482')).toBeInTheDocument();
    expect(screen.queryByText('Hộp của bạn chưa đầy')).not.toBeInTheDocument();
  });

  it('gửi lỗi: báo lỗi + cho gửi lại, giữ nguyên dữ liệu đã nhập và hộp trong store', async () => {
    seed();
    const { service } = fakeService([
      { ok: false, error: 'offline' },
      { ok: true, orderId: 'KT-20261111-9999' },
    ]);
    renderPage(service);
    await screen.findByRole('heading', { name: 'Thông tin giao hàng' });
    fillValid();
    submit();

    expect(await screen.findByRole('alert')).toHaveTextContent(/Chưa gửi được đơn/);
    expect(screen.getByLabelText(/Họ tên/)).toHaveValue('Nguyễn Văn An');
    expect(screen.getByLabelText(/Số điện thoại/)).toHaveValue('0912.345.678');
    expect(useBoxStore.getState().slots).toEqual(FULL6);

    fireEvent.click(screen.getByRole('button', { name: 'Gửi lại' }));
    expect(await screen.findByText('KT-20261111-9999')).toBeInTheDocument();
  });

  it('đang gửi: nút loading, các ô bị khoá', async () => {
    seed();
    let release: (r: OrderResult) => void = () => undefined;
    const service: OrderService = {
      submitOrder: () => new Promise<OrderResult>((resolve) => (release = resolve)),
    };
    renderPage(service);
    await screen.findByRole('heading', { name: 'Thông tin giao hàng' });
    fillValid();
    submit();
    const btn = await screen.findByRole('button', { name: 'Đang gửi đơn…' });
    expect(btn).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByLabelText(/Họ tên/)).toBeDisabled();
    release({ ok: true, orderId: 'KT-1' });
    expect(await screen.findByText('KT-1')).toBeInTheDocument();
  });
});
