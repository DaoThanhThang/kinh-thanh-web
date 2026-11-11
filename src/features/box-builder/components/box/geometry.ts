/**
 * Hình học hộp quà. Đơn vị: một ô = 1. Khung (lề từ mép hộp tới khay) là MARGIN_X / MARGIN_Y ô.
 * Tỉ lệ hộp theo lưới (cols:rows) cộng lề, nên hộp 12 (4×3) xấp xỉ 4:3 như hộp thật (D12).
 */
export const MARGIN_X = 0.55;
export const MARGIN_Y = 0.42;

export type BoxGeometry = {
  cols: number;
  rows: number;
  /** Chiều rộng hộp tính bằng ô. */
  width: number;
  /** Chiều cao hộp tính bằng ô. */
  height: number;
  /** Rộng / cao. */
  aspect: number;
};

export function boxGeometry(cols: number, rows: number): BoxGeometry {
  const width = cols + 2 * MARGIN_X;
  const height = rows + 2 * MARGIN_Y;
  return { cols, rows, width, height, aspect: width / height };
}

/** Biến CSS mô tả lưới; box.css dựa vào các biến này để tính mọi kích thước theo `--bw`. */
export function boxCssVars(cols: number, rows: number): Record<string, string | number> {
  const g = boxGeometry(cols, rows);
  return {
    '--cols': g.cols,
    '--rows': g.rows,
    '--wu': g.width,
    '--hu': g.height,
    '--ar': g.aspect.toFixed(4),
    '--mx': MARGIN_X,
    '--my': MARGIN_Y,
  };
}
