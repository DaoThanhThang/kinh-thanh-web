import { useId } from 'react';
import { boxGeometry } from './geometry';

export type RibbonState =
  /** Đang vẽ ra (hoạt ảnh ~900ms). */
  | 'tying'
  /** Đã thắt xong, tĩnh. */
  | 'tied'
  /** Đang gỡ (mờ đi). */
  | 'untying';

/** Bề rộng dải và các điểm cắt, đơn vị viewBox (rộng 1000). */
const BAND = 62;

/**
 * Ruy băng champagne đặt trên mặt ngoài nắp, giao điểm ở khoảng 32% chiều rộng: một dải ngang, một dải dọc và nơ có hai vành, hai đuôi.
 * Vẽ bằng SVG, màu lấy từ token foil (qua CSS var), kích thước theo tỉ lệ nắp (cols × rows).
 * Dải "vẽ ra" bằng stroke-dashoffset (pathLength = 1); nơ hiện sau cùng. Hoạt ảnh trong box.css.
 */
export function Ribbon({
  cols,
  rows,
  state = 'tied',
  className,
}: {
  cols: number;
  rows: number;
  state?: RibbonState;
  className?: string;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const gh = `${uid}-h`;
  const gv = `${uid}-v`;
  const gl = `${uid}-l`;
  const W = 1000;
  const H = Math.round(W / boxGeometry(cols, rows).aspect);
  // Giao điểm lệch về phần trống đồng (ba phần trái, thấp hơn giữa) để không che logo và tagline (G1).
  const cx = Math.round(W * 0.32);
  const cy = Math.round(H * 0.72);
  const half = BAND / 2;
  const edge = half - 6;

  /** Một vành nơ ở toạ độ cục bộ (tâm nút = 0,0), hướng sang trái; vành phải là bản lật. */
  const loop = (
    <g>
      <path
        d="M-14 0C-62 -84 -196 -98 -214 -40C-228 8 -112 34 -14 8Z"
        fill={`url(#${gl})`}
        stroke="var(--color-foil-700)"
        strokeWidth="1.5"
      />
      <path
        d="M-26 -2C-84 -54 -166 -64 -190 -36"
        fill="none"
        stroke="var(--color-foil-300)"
        strokeOpacity="0.7"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M-22 4C-92 2 -152 -8 -202 -26"
        fill="none"
        stroke="var(--color-cacao-950)"
        strokeOpacity="0.35"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </g>
  );
  const tail = (
    <path
      d="M-14 8L-100 186L-68 170L-46 200L8 12Z"
      fill={`url(#${gl})`}
      stroke="var(--color-foil-700)"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  );

  return (
    <svg
      className={['gb-ribbon', className].filter(Boolean).join(' ')}
      data-state={state}
      viewBox={`0 0 ${W} ${H}`}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient
          id={gh}
          gradientUnits="userSpaceOnUse"
          x1="0"
          x2="0"
          y1={cy - half}
          y2={cy + half}
        >
          <stop offset="0" stopColor="var(--color-foil-600)" />
          <stop offset="0.38" stopColor="var(--color-foil-300)" />
          <stop offset="0.62" stopColor="var(--color-foil-500)" />
          <stop offset="1" stopColor="var(--color-foil-700)" />
        </linearGradient>
        <linearGradient
          id={gv}
          gradientUnits="userSpaceOnUse"
          x1={cx - half}
          x2={cx + half}
          y1="0"
          y2="0"
        >
          <stop offset="0" stopColor="var(--color-foil-600)" />
          <stop offset="0.38" stopColor="var(--color-foil-300)" />
          <stop offset="0.62" stopColor="var(--color-foil-500)" />
          <stop offset="1" stopColor="var(--color-foil-700)" />
        </linearGradient>
        <linearGradient id={gl} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="var(--color-foil-300)" />
          <stop offset="0.55" stopColor="var(--color-foil-500)" />
          <stop offset="1" stopColor="var(--color-foil-700)" />
        </linearGradient>
      </defs>

      <g className="gb-ribbon-bands">
        <path
          className="gb-rb gb-rb-h"
          d={`M-20 ${cy}H${W + 20}`}
          pathLength="1"
          fill="none"
          stroke={`url(#${gh})`}
          strokeWidth={BAND}
        />
        <path
          className="gb-rb gb-rb-v"
          d={`M${cx} -20V${H + 20}`}
          pathLength="1"
          fill="none"
          stroke={`url(#${gv})`}
          strokeWidth={BAND}
        />
        {/* Đường mép dệt: mảnh, màu cacao mờ. */}
        {[-edge, edge].map((o) => (
          <path
            key={`h${o}`}
            className="gb-rb gb-rb-h gb-rb-edge"
            d={`M-20 ${cy + o}H${W + 20}`}
            pathLength="1"
            fill="none"
            stroke="var(--color-cacao-950)"
            strokeOpacity="0.35"
            strokeWidth="1.5"
          />
        ))}
        {[-edge, edge].map((o) => (
          <path
            key={`v${o}`}
            className="gb-rb gb-rb-v gb-rb-edge"
            d={`M${cx + o} -20V${H + 20}`}
            pathLength="1"
            fill="none"
            stroke="var(--color-cacao-950)"
            strokeOpacity="0.35"
            strokeWidth="1.5"
          />
        ))}
      </g>

      <g transform={`translate(${cx} ${cy})`}>
        <g className="gb-bow">
          {tail}
          <g transform="scale(-0.94 0.92) rotate(-6)">{tail}</g>
          {loop}
          <g transform="scale(-1 1)">{loop}</g>
          <rect
            x="-30"
            y="-27"
            width="60"
            height="54"
            rx="11"
            fill={`url(#${gl})`}
            stroke="var(--color-foil-700)"
            strokeWidth="1.5"
          />
          <path
            d="M-20 -14C-8 -20 8 -20 20 -14"
            fill="none"
            stroke="var(--color-foil-300)"
            strokeOpacity="0.8"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
      </g>
    </svg>
  );
}
