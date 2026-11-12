import type { SVGProps } from 'react';

const base: SVGProps<SVGSVGElement> = {
  viewBox: '0 0 32 32',
  width: 32,
  height: 32,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.1,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: 'false',
};

/** Hộp quà có ruy băng: bước đặt hàng. */
function OrderMark() {
  return (
    <svg {...base}>
      <rect x="5" y="13" width="22" height="14" />
      <path d="M4 13V9.5h24V13" />
      <path d="M16 9.5V27" />
      <path d="M16 9.5C13 4 8.5 5.5 10 8.2c1.2 1.8 4.2 1.3 6 1.3Z" />
      <path d="M16 9.5C19 4 23.5 5.5 22 8.2c-1.2 1.8-4.2 1.3-6 1.3Z" />
    </svg>
  );
}

/** Khung chat với dấu tích: xác nhận qua điện thoại hoặc Zalo. */
function ConfirmMark() {
  return (
    <svg {...base}>
      <path d="M5 6h22a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H15l-6 5v-5H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z" />
      <path d="M10.5 14.2l3.6 3.6 7.4-7.6" />
    </svg>
  );
}

/** Túi giữ nhiệt với tinh thể lạnh. */
function PackMark() {
  return (
    <svg {...base}>
      <path d="M7 11h18l1.5 16h-21Z" />
      <path d="M11.5 11V8.5a4.5 4.5 0 0 1 9 0V11" />
      <path d="M16 16v7M12.9 17.8l6.2 3.4M19.1 17.8l-6.2 3.4" />
    </svg>
  );
}

/** Ghim vị trí: giao tận tay. */
function HandoffMark() {
  return (
    <svg {...base}>
      <path d="M16 28S6.5 19.4 6.5 12.5a9.5 9.5 0 0 1 19 0C25.5 19.4 16 28 16 28Z" />
      <circle cx="16" cy="12.5" r="3.6" />
    </svg>
  );
}

/** Máy ảnh: chụp ảnh hộp và viên. */
function PhotoMark() {
  return (
    <svg {...base}>
      <path d="M4 10h5l2-3h10l2 3h5v16H4Z" />
      <circle cx="16" cy="17.5" r="4.6" />
    </svg>
  );
}

/** Hai mũi tên vòng: đổi hộp hoặc hoàn tiền. */
function ExchangeMark() {
  return (
    <svg {...base}>
      <path d="M6 12h17l-4-4M26 20H9l4 4" />
    </svg>
  );
}

const RETURN_MARKS = [PhotoMark, ConfirmMark, ExchangeMark] as const;

export function ReturnMark({ index }: { index: number }) {
  const Mark = RETURN_MARKS[index % RETURN_MARKS.length] ?? PhotoMark;
  return <Mark />;
}

const MARKS = [OrderMark, ConfirmMark, PackMark, HandoffMark] as const;

export function StepMark({ index }: { index: number }) {
  const Mark = MARKS[index % MARKS.length] ?? OrderMark;
  return <Mark />;
}

/**
 * Thang đo nhiệt độ vẽ nét mảnh: ống, bầu, vạch chia mỗi độ (dài hơn mỗi 5 độ) và dải khuyên dùng
 * tô foil. Trả về cả vị trí dải (phần trăm chiều cao) để chữ số lớn đặt ngang dải.
 */
export function gaugeScale(min: number, max: number) {
  const lo = Math.floor((min - 6) / 5) * 5;
  const hi = Math.ceil((max + 12) / 5) * 5;
  const top = 18;
  const bottom = 292;
  const y = (t: number) => bottom - ((t - lo) / (hi - lo)) * (bottom - top);
  return { lo, hi, top, bottom, y, bandTop: y(max), bandBottom: y(min) };
}

export function Gauge({ min, max, label }: { min: number; max: number; label: string }) {
  const { lo, hi, y, bandTop, bandBottom } = gaugeScale(min, max);
  const ticks: number[] = [];
  for (let t = lo; t <= hi; t += 1) ticks.push(t);
  return (
    <svg
      className="ip-gauge-svg"
      viewBox="0 0 150 360"
      role="img"
      aria-label={label}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
    >
      {/* Ống và bầu */}
      <path d="M44 24a12 12 0 0 1 24 0V296.4a24 24 0 1 1-24 0Z" vectorEffect="non-scaling-stroke" />
      {/* Dải khuyên dùng */}
      <rect
        x="48.5"
        y={bandTop}
        width="15"
        height={bandBottom - bandTop}
        fill="currentColor"
        fillOpacity="0.9"
        stroke="none"
      />
      <circle cx="56" cy="320" r="17" fill="currentColor" fillOpacity="0.9" stroke="none" />
      <rect
        x="48.5"
        y={bandBottom}
        width="15"
        height={310 - bandBottom}
        fill="currentColor"
        fillOpacity="0.18"
        stroke="none"
      />
      {/* Vạch chia */}
      {ticks.map((t) => {
        const major = t % 5 === 0;
        return (
          <g key={t}>
            <path
              d={`M40 ${y(t)}h${major ? -14 : -7}`}
              vectorEffect="non-scaling-stroke"
              opacity={major ? 1 : 0.55}
            />
            {major ? (
              <text
                x="20"
                y={y(t) + 4}
                textAnchor="end"
                fill="currentColor"
                stroke="none"
                fontSize="12"
                fontFamily="var(--font-sans)"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {t}
              </text>
            ) : null}
          </g>
        );
      })}
      {/* Đường dẫn từ dải ra chữ số */}
      <path d={`M72 ${bandTop}H150M72 ${bandBottom}H150`} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
