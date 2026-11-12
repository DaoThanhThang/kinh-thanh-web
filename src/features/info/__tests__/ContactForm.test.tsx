import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { info } from '@/content/info';
import { contactSchema } from '@/lib/schemas/contact';
import { MockContactService, type ContactService } from '@/lib/services/contact';
import { ContactForm } from '../ContactForm';

afterEach(cleanup);

describe('contactSchema', () => {
  const ok = { name: ' An ', contact: '0912 345 678', message: ' Xin chào ' };
  it('chuẩn hoá: trim, số điện thoại 10 chữ số', () => {
    const r = contactSchema.safeParse(ok);
    expect(r.success && r.data).toEqual({ name: 'An', contact: '0912345678', message: 'Xin chào' });
  });
  it('chấp nhận email', () => {
    expect(contactSchema.safeParse({ ...ok, contact: 'an@vidu.com' }).success).toBe(true);
  });
  it('từ chối thiếu tên, liên hệ sai, nội dung rỗng/quá dài', () => {
    expect(contactSchema.safeParse({ ...ok, name: ' ' }).success).toBe(false);
    expect(contactSchema.safeParse({ ...ok, contact: '123' }).success).toBe(false);
    expect(contactSchema.safeParse({ ...ok, message: '' }).success).toBe(false);
    expect(contactSchema.safeParse({ ...ok, message: 'x'.repeat(1001) }).success).toBe(false);
  });
});

describe('MockContactService', () => {
  it('chỉ ghi console rồi báo thành công', async () => {
    const log = vi.fn();
    const res = await new MockContactService({ delayMs: 0, log }).sendMessage({
      name: 'An',
      contact: 'an@vidu.com',
      message: 'hi',
      createdAt: '2026-11-12T00:00:00.000Z',
    });
    expect(res).toEqual({ ok: true });
    expect(log).toHaveBeenCalledOnce();
  });
});

const fill = (name: string, contact: string, message: string) => {
  fireEvent.change(screen.getByLabelText(/Họ và tên/), { target: { value: name } });
  fireEvent.change(screen.getByLabelText(/Số điện thoại hoặc email/), {
    target: { value: contact },
  });
  fireEvent.change(screen.getByLabelText(/Nội dung/), { target: { value: message } });
};

describe('ContactForm', () => {
  it('gửi rỗng: hiện lỗi từng ô, focus ô sai đầu tiên, không gọi service', () => {
    const service: ContactService = { sendMessage: vi.fn() };
    render(<ContactForm service={service} />);
    fireEvent.click(screen.getByRole('button', { name: info.form.submit }));
    expect(screen.getByText(info.form.errors.nameRequired)).toBeInTheDocument();
    expect(screen.getByText(info.form.errors.contactRequired)).toBeInTheDocument();
    expect(screen.getByText(info.form.errors.messageRequired)).toBeInTheDocument();
    expect(screen.getByLabelText(/Họ và tên/)).toHaveFocus();
    expect(screen.getByLabelText(/Họ và tên/)).toHaveAttribute('aria-invalid', 'true');
    expect(service.sendMessage).not.toHaveBeenCalled();
  });

  it('liên hệ sai định dạng → lỗi cụ thể', () => {
    render(<ContactForm service={{ sendMessage: vi.fn() }} />);
    fill('An', '12345', 'Xin chào');
    fireEvent.click(screen.getByRole('button', { name: info.form.submit }));
    expect(screen.getByText(info.form.errors.contactInvalid)).toBeInTheDocument();
  });

  it('hợp lệ → gửi dữ liệu đã chuẩn hoá và hiện lời cảm ơn', async () => {
    const sendMessage = vi.fn().mockResolvedValue({ ok: true });
    render(<ContactForm service={{ sendMessage }} />);
    fill(' An ', '0912 345 678', 'Xin chào');
    fireEvent.click(screen.getByRole('button', { name: info.form.submit }));
    expect(await screen.findByText(info.form.successHeading)).toBeInTheDocument();
    expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'An', contact: '0912345678', message: 'Xin chào' }),
    );
    fireEvent.click(screen.getByRole('button', { name: info.form.another }));
    expect(screen.getByLabelText(/Họ và tên/)).toHaveValue('');
  });

  it('lỗi dịch vụ → báo lỗi, giữ dữ liệu nhập, cho gửi lại', async () => {
    const sendMessage = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, error: 'x' })
      .mockResolvedValueOnce({ ok: true });
    render(<ContactForm service={{ sendMessage }} />);
    fill('An', 'an@vidu.com', 'Xin chào');
    fireEvent.click(screen.getByRole('button', { name: info.form.submit }));
    expect(await screen.findByRole('alert')).toHaveTextContent(info.form.submitError);
    expect(screen.getByLabelText(/Họ và tên/)).toHaveValue('An');
    fireEvent.click(screen.getByRole('button', { name: info.form.retry }));
    await waitFor(() => expect(screen.getByText(info.form.successHeading)).toBeInTheDocument());
  });
});
