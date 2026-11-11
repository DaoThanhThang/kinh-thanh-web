import { wave } from './paths';

/** Sóng và đồi nét cong ở chân nắp hộp (viewBox 1000×200, bám đáy). */
const LINES = [0, 1, 2, 3, 4].map((k) =>
  wave(-40, 1040, 120 + k * 16, 7 + (k % 2) * 3, 100 + k * 12),
);
const HILL_RINGS = [34, 52, 70, 88, 106, 124];

export function Waves({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1000 200"
      preserveAspectRatio="xMidYMax slice"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      aria-hidden="true"
      className={className}
      style={{ strokeWidth: 'var(--foil-w, 1.1px)' }}
    >
      {LINES.map((d, i) => (
        <path key={d} d={d} opacity={0.75 - i * 0.1} vectorEffect="non-scaling-stroke" />
      ))}
      {HILL_RINGS.map((r, i) => (
        <circle
          key={r}
          cx="820"
          cy="230"
          r={r}
          opacity={0.7 - i * 0.07}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}
