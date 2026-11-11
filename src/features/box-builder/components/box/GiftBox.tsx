import type { CSSProperties, ReactNode } from 'react';
import { BoxBase } from './BoxBase';
import { BoxLid } from './BoxLid';
import { LidInner } from './LidInner';
import { Tray } from './Tray';
import { boxCssVars } from './geometry';
import './box.css';

export type GiftBoxProps = {
  cols: number;
  rows: number;
  /**
   * Độ mở nắp 0 (đóng) → 1 (mở). Không truyền: kế thừa biến CSS `--open` từ phần tử cha
   * (để CSS transition ở cha điều khiển mà không render lại React).
   */
  open?: number;
  /** Bọc logo trên nắp bằng h1 (chỉ một nơi trong trang). */
  heading?: boolean;
  /** Nội dung của ô thứ i trong khay. */
  renderCell?: (index: number) => ReactNode;
  /** Thay nội dung mặt trong nắp (mặc định: LidInner với họa tiết cổng thành). */
  lidInner?: ReactNode;
  /** Phủ lên mặt ngoài nắp, ví dụ <Ribbon />. */
  lidOverlay?: ReactNode;
  className?: string;
};

/**
 * Hộp quà Kinh Thành dựng bằng SVG/CSS 2.5D (D02). Lắp từ các phần: BoxBase + Tray, BoxLid
 * (mặt ngoài) và LidInner (mặt trong nắp). Kích thước theo `--bw` (mặc định tối đa 55rem).
 */
export function GiftBox({
  cols,
  rows,
  open,
  heading,
  renderCell,
  lidInner,
  lidOverlay,
  className,
}: GiftBoxProps) {
  const style: CSSProperties = { ...boxCssVars(cols, rows) } as CSSProperties;
  if (open !== undefined) (style as Record<string, unknown>)['--open'] = open;
  return (
    <div className={['gb', className].filter(Boolean).join(' ')} style={style}>
      <div className="gb-shadow" aria-hidden="true" />
      <div className="gb-rig">
        <BoxBase>
          <Tray cols={cols} rows={rows} renderCell={renderCell} />
        </BoxBase>
        <BoxLid heading={heading} inner={lidInner ?? <LidInner />} overlay={lidOverlay} />
      </div>
    </div>
  );
}
