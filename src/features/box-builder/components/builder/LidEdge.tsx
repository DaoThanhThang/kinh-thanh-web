import { circlePath, radialTicks, starPath } from '../box/art/paths';

/**
 * Mặt trong nắp dùng trong builder: nắp chỉ còn là một dải mỏng nên không vẽ họa tiết (sẽ bị ép
 * thành vạch). Chỉ có mặt cacao, một đường foil mảnh và dấu sao-mặt trời nhỏ ở giữa. Dấu được
 * kéo giãn ngược theo độ nghiêng của nắp (xem .bb-lid-mark) để nhìn lên vẫn tròn.
 */
export function LidEdge() {
  return (
    <>
      <div className="bb-lid-line" aria-hidden="true" />
      <svg className="bb-lid-mark" viewBox="-12 -12 24 24" aria-hidden="true" focusable="false">
        <g fill="none" stroke="currentColor" strokeWidth="0.9" strokeLinejoin="round">
          <path d={starPath(8, 8.5, 4.2)} />
          <path d={circlePath(2.2)} />
          <path d={radialTicks(16, 10, 11.2)} strokeLinecap="round" />
        </g>
      </svg>
    </>
  );
}
