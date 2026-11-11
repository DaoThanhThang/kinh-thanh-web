import { clsx } from 'clsx';

const POINTS = 14;

/** Ngôi sao 14 cánh kiểu mặt trống đồng Đông Sơn, vẽ bằng nét mảnh quanh tâm (cx, cy). */
function sunStarPath(cx: number, cy: number, outer: number, inner: number): string {
  const steps = POINTS * 2;
  const pts = Array.from({ length: steps }, (_, i) => {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI * 2 * i) / steps - Math.PI / 2;
    return `${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`;
  });
  return `M${pts.join('L')}Z`;
}

const STAR = sunStarPath(14, 14, 12.5, 4.6);

function Rule() {
  return (
    <svg className="h-px min-w-0 flex-1" preserveAspectRatio="none" aria-hidden="true">
      <line
        x1="0"
        y1="0.5"
        x2="100%"
        y2="0.5"
        stroke="currentColor"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/**
 * Vạch phân cách foil: đường mảnh hai bên, ngôi sao 14 cánh nhỏ ở giữa. Trang trí, ẩn với trình đọc.
 */
export function FoilDivider({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={clsx('flex w-full items-center gap-4 text-accent', className)}
    >
      <span className="flex min-w-0 flex-1 opacity-60">
        <Rule />
      </span>
      <svg viewBox="0 0 28 28" width="28" height="28" fill="none" className="shrink-0">
        <path d={STAR} stroke="currentColor" strokeWidth="0.75" strokeLinejoin="round" />
        <circle cx="14" cy="14" r="2" stroke="currentColor" strokeWidth="0.75" />
      </svg>
      <span className="flex min-w-0 flex-1 opacity-60">
        <Rule />
      </span>
    </div>
  );
}
