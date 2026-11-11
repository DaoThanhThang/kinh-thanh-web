import { describe, expect, it } from 'vitest';
import { formatVnd } from '@/lib/utils/formatVnd';

describe('formatVnd', () => {
  it('định dạng tiền Việt Nam', () => {
    expect(formatVnd(350000)).toBe('350.000 ₫');
  });

  it('định dạng số 0', () => {
    expect(formatVnd(0)).toBe('0 ₫');
  });
});
