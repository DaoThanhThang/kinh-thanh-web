import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { FaqAccordion } from '../FaqAccordion';

afterEach(cleanup);

const groups = [
  {
    title: 'Đặt hàng',
    items: [
      { question: 'Câu một?', answer: 'Trả lời một.' },
      { question: 'Câu hai?', answer: 'Trả lời hai.' },
    ],
  },
  { title: 'Giao nhận', items: [{ question: 'Câu ba?', answer: 'Trả lời ba.' }] },
];

describe('FaqAccordion', () => {
  it('nhóm có tiêu đề h3, mỗi câu hỏi là nút trong h4, mặc định đóng hết', () => {
    render(<FaqAccordion groups={groups} />);
    expect(screen.getByRole('heading', { level: 3, name: 'Đặt hàng' })).toBeInTheDocument();
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3);
    for (const b of buttons) expect(b).toHaveAttribute('aria-expanded', 'false');
    // Vùng đóng bị inert (Tab và trình đọc màn hình bỏ qua).
    for (const r of screen.getAllByRole('region', { hidden: true })) {
      expect(r).toHaveAttribute('inert');
    }
  });

  it('aria-controls trỏ tới vùng trả lời, vùng được gán nhãn bởi nút', () => {
    render(<FaqAccordion groups={groups} />);
    const btn = screen.getByRole('button', { name: 'Câu một?' });
    fireEvent.click(btn);
    expect(btn).toHaveAttribute('aria-expanded', 'true');
    const region = screen.getByRole('region', { name: 'Câu một?', hidden: true });
    expect(btn.getAttribute('aria-controls')).toBe(region.id);
    expect(region).not.toHaveAttribute('inert');
    expect(region).toHaveTextContent('Trả lời một.');
  });

  it('chỉ mở một câu mỗi lần; bấm lại thì đóng', () => {
    render(<FaqAccordion groups={groups} />);
    const one = screen.getByRole('button', { name: 'Câu một?' });
    const three = screen.getByRole('button', { name: 'Câu ba?' });
    fireEvent.click(one);
    fireEvent.click(three);
    expect(one).toHaveAttribute('aria-expanded', 'false');
    expect(three).toHaveAttribute('aria-expanded', 'true');
    const open = () =>
      screen.getAllByRole('region', { hidden: true }).filter((r) => !r.hasAttribute('inert'));
    expect(open()).toHaveLength(1);
    fireEvent.click(three);
    expect(three).toHaveAttribute('aria-expanded', 'false');
    expect(open()).toHaveLength(0);
  });

  it('là <button> thật nên Enter/Space của trình duyệt kích hoạt được (focus được, không tabindex âm)', () => {
    render(<FaqAccordion groups={groups} />);
    for (const b of screen.getAllByRole('button')) {
      expect(b.tagName).toBe('BUTTON');
      expect(b).not.toHaveAttribute('tabindex', '-1');
    }
  });
});
