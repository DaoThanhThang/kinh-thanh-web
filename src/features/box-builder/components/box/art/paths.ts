/** Hàm dựng đường nét cho họa tiết (thuần, tất định để SSR/CSR khớp nhau). */

const f = (n: number) => n.toFixed(2);

export function polar(r: number, a: number): [number, number] {
  return [r * Math.cos(a), r * Math.sin(a)];
}

/** Ngôi sao nhiều cánh quanh gốc tọa độ; cánh đầu tiên chỉ lên trên. */
export function starPath(points: number, outer: number, inner: number): string {
  const steps = points * 2;
  const pts = Array.from({ length: steps }, (_, i) => {
    const [x, y] = polar(i % 2 === 0 ? outer : inner, (Math.PI * 2 * i) / steps - Math.PI / 2);
    return `${f(x)} ${f(y)}`;
  });
  return `M${pts.join('L')}Z`;
}

export function circlePath(r: number): string {
  return `M${f(-r)} 0A${r} ${r} 0 1 0 ${f(r)} 0A${r} ${r} 0 1 0 ${f(-r)} 0Z`;
}

/** Vạch ngắn hướng tâm giữa hai bán kính. */
export function radialTicks(count: number, r0: number, r1: number, offset = 0): string {
  return Array.from({ length: count }, (_, i) => {
    const a = (Math.PI * 2 * (i + offset)) / count;
    const [x0, y0] = polar(r0, a);
    const [x1, y1] = polar(r1, a);
    return `M${f(x0)} ${f(y0)}L${f(x1)} ${f(y1)}`;
  }).join('');
}

/** Đường zigzag khép kín giữa hai bán kính. */
export function zigzag(count: number, rIn: number, rOut: number): string {
  const steps = count * 2;
  const pts = Array.from({ length: steps }, (_, i) => {
    const [x, y] = polar(i % 2 === 0 ? rIn : rOut, (Math.PI * 2 * i) / steps);
    return `${f(x)} ${f(y)}`;
  });
  return `M${pts.join('L')}Z`;
}

/** Hình thoi nhỏ đặt trên vòng bán kính r, xen kẽ với chấm. */
export function diamonds(count: number, r: number, size: number): string {
  return Array.from({ length: count }, (_, i) => {
    const a = (Math.PI * 2 * i) / count;
    const [cx, cy] = polar(r, a);
    const [ux, uy] = polar(size, a);
    const [vx, vy] = polar(size * 0.55, a + Math.PI / 2);
    return `M${f(cx + ux)} ${f(cy + uy)}L${f(cx + vx)} ${f(cy + vy)}L${f(cx - ux)} ${f(cy - uy)}L${f(cx - vx)} ${f(cy - vy)}Z`;
  }).join('');
}

/** Cung vảy (scallop) nối các điểm trên vòng rOut, lõm vào tới rIn. */
export function scallops(count: number, rIn: number, rOut: number): string {
  const parts = Array.from({ length: count }, (_, i) => {
    const a0 = (Math.PI * 2 * i) / count;
    const a1 = (Math.PI * 2 * (i + 1)) / count;
    const [x0, y0] = polar(rOut, a0);
    const [x1, y1] = polar(rOut, a1);
    const [cx, cy] = polar(rIn - (rOut - rIn) * 0.2, (a0 + a1) / 2);
    return `M${f(x0)} ${f(y0)}Q${f(cx)} ${f(cy)} ${f(x1)} ${f(y1)}`;
  });
  return parts.join('');
}

/** Dấu chấm nhỏ (vòng tròn bán kính dot) trên vòng bán kính r. */
export function dots(count: number, r: number, dot: number): string {
  return Array.from({ length: count }, (_, i) => {
    const [x, y] = polar(r, (Math.PI * 2 * (i + 0.5)) / count);
    return `M${f(x - dot)} ${f(y)}a${dot} ${dot} 0 1 0 ${f(dot * 2)} 0a${dot} ${dot} 0 1 0 ${f(-dot * 2)} 0`;
  }).join('');
}

/** Dải sóng nằm ngang: chuỗi Q với biên độ amp, bước step, từ x0 tới x1 ở độ cao y. */
export function wave(x0: number, x1: number, y: number, amp: number, step: number): string {
  let d = `M${f(x0)} ${f(y)}`;
  let dir = -1;
  for (let x = x0; x < x1; x += step) {
    d += `Q${f(x + step / 2)} ${f(y + dir * amp)} ${f(x + step)} ${f(y)}`;
    dir = -dir;
  }
  return d;
}
