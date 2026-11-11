import type { CSSProperties, ReactNode } from 'react';

export type TrayProps = {
  cols: number;
  rows: number;
  /** Nội dung của ô thứ `index` (0 → cols*rows-1, trái → phải, trên → dưới). Mặc định: ô trống. */
  renderCell?: (index: number) => ReactNode;
  className?: string;
};

/**
 * Khay vàng ánh kim với vách ngăn vàng. Mỗi ô là một ngăn lõm; `renderCell` đặt viên vào ô.
 * Kích thước theo `--bw` của hộp (xem box.css), ô luôn vuông.
 */
export function Tray({ cols, rows, renderCell, className }: TrayProps) {
  const count = cols * rows;
  const style = { '--cols': cols, '--rows': rows } as CSSProperties;
  return (
    <div className={['gb-tray', className].filter(Boolean).join(' ')} style={style}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="gb-cell" data-slot={i}>
          {renderCell?.(i)}
        </div>
      ))}
    </div>
  );
}
