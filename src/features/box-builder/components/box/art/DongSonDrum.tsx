import { circlePath, diamonds, dots, radialTicks, scallops, starPath, zigzag } from './paths';

/** Mọi đường nét của mặt trống, dựng một lần ở mức module. Bán kính ngoài cùng = 100. */
const STAR = starPath(14, 25, 8.5);
const HAIRLINES = [28, 33, 45, 57, 69, 80, 92, 97].map(circlePath).join('');
const TICKS = radialTicks(60, 34.5, 43.5);
const ZIG = zigzag(40, 46.5, 55);
const DIAMONDS = diamonds(26, 63, 3.6);
const DOTS = dots(26, 63, 0.7);
const SCALLOPS = scallops(36, 71.5, 79);
const RIM_DOTS = dots(72, 86, 0.8);
const BIRD = 'M-3.2 0L0 -4.4L3.2 0M0 -4.4V3.2';
const BIRD_RING = Array.from({ length: 20 }, (_, i) => (360 / 20) * i);

/**
 * Mặt trống đồng Đông Sơn: ngôi sao 14 cánh ở tâm và các vòng hoa văn đồng tâm (vạch, zigzag, hình
 * thoi, vảy, chim cách điệu). Chỉ có nét mảnh theo currentColor; độ dày nét không đổi theo tỉ lệ.
 * Thành phần được xoay khi nắp mở (CSS: `.gb-drum`).
 */
export function DongSonDrum({ className }: { className?: string }) {
  return (
    <svg
      viewBox="-100 -100 200 200"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      style={{ strokeWidth: 'var(--foil-w, 1.1px)' }}
    >
      <g vectorEffect="non-scaling-stroke">
        <path d={STAR} fill="currentColor" fillOpacity="0.14" vectorEffect="non-scaling-stroke" />
        <path d={HAIRLINES} opacity="0.85" vectorEffect="non-scaling-stroke" />
        <path d={TICKS} opacity="0.7" vectorEffect="non-scaling-stroke" />
        <path d={ZIG} opacity="0.75" vectorEffect="non-scaling-stroke" />
        <path d={DIAMONDS} opacity="0.8" vectorEffect="non-scaling-stroke" />
        <path d={DOTS} opacity="0.7" vectorEffect="non-scaling-stroke" />
        <path d={SCALLOPS} opacity="0.75" vectorEffect="non-scaling-stroke" />
        <path d={RIM_DOTS} opacity="0.7" vectorEffect="non-scaling-stroke" />
        {BIRD_RING.map((deg) => (
          <path
            key={deg}
            d={BIRD}
            transform={`rotate(${deg}) translate(0 -88.5)`}
            opacity="0.7"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </g>
    </svg>
  );
}
