'use client';

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react';
import { LacBird } from '@/features/box-builder/components/box/art/LacBird';
import {
  circlePath,
  diamonds,
  dots,
  radialTicks,
  starPath,
} from '@/features/box-builder/components/box/art/paths';
import {
  ART_CENTER,
  ART_H,
  ART_W,
  HERO_MASK_URL,
  ORBITS,
  RING_R,
  RING_SECONDS,
  pctX,
  pctY,
} from './heroArt';
import { motionReduced, subscribeMotion } from './heroMotion';

/** Vòng đồng tâm, sao mặt trời, vạch tia, chấm, hình thoi: dựng một lần (tất định, SSR = CSR). */
const HAIRLINES = [430, 402, 376, 352, 330, 310].map(circlePath);
const STAR = starPath(14, 246, 202);
const TICKS = radialTicks(84, 270, 286);
const DOT_RING = dots(56, 344, 1.6);
const DIAMOND_RING = diamonds(14, 392, 5.5);
const INNER_STAR_LINES = radialTicks(14, 120, 200, 0.5);

function Rings() {
  return (
    <svg
      viewBox={`${-RING_R} ${-RING_R} ${RING_R * 2} ${RING_R * 2}`}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className="hero-ring-svg"
    >
      <g vectorEffect="non-scaling-stroke">
        {HAIRLINES.map((d, i) => (
          <path
            key={i}
            d={d}
            opacity={i === 0 ? 0.6 : 0.34 - i * 0.03}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <path
          d={STAR}
          fill="currentColor"
          fillOpacity="0.07"
          opacity="0.7"
          vectorEffect="non-scaling-stroke"
        />
        <path d={INNER_STAR_LINES} opacity="0.3" vectorEffect="non-scaling-stroke" />
        <path d={TICKS} opacity="0.4" vectorEffect="non-scaling-stroke" />
        <path d={DOT_RING} opacity="0.5" vectorEffect="non-scaling-stroke" />
        <path d={DIAMOND_RING} opacity="0.55" vectorEffect="non-scaling-stroke" />
      </g>
    </svg>
  );
}

type Vars = CSSProperties & Record<`--${string}`, string | number>;

/**
 * Nền hero dạng art (R2): ảnh tĩnh `hero-citadel.jpg` (thành, đồi, sóng, ánh hoàng hôn) + hai lớp
 * động đặt ĐÚNG tâm cổng thành: vòng trống đồng quay chậm và hai quỹ đạo chim. Chỉ `transform`
 * chuyển động (CSS animation, lớp riêng). Khung "sân khấu" 16:9 tính như object-fit: cover nên
 * ảnh và các lớp luôn khớp ở mọi cỡ màn hình. Tạm dừng khi ngoài khung nhìn / tab ẩn, tắt hẳn khi
 * giảm chuyển động. Lớp động bị che bởi cổng thành và đồi (khuôn alpha) để đi "phía sau" thành.
 */
export function HeroArt({ background }: { background: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const reduced = useSyncExternalStore(subscribeMotion, motionReduced, () => false);
  const [inView, setInView] = useState(true);
  const [tabHidden, setTabHidden] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let io: IntersectionObserver | undefined;
    if (typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver(([entry]) => setInView(entry ? entry.isIntersecting : true));
      io.observe(root);
    }
    const onVis = () => setTabHidden(document.hidden);
    onVis();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      io?.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  const paused = reduced || !inView || tabHidden;
  const stageVars: Vars = { '--hero-mask': HERO_MASK_URL };

  return (
    <div
      ref={rootRef}
      className="hero-media hero-media--art"
      aria-hidden="true"
      data-motion={reduced ? 'still' : 'on'}
      data-paused={paused ? 'true' : 'false'}
    >
      <div className="hero-art-stage" style={stageVars}>
        {/* Ảnh LCP: có sẵn trong HTML từ server, ưu tiên cao. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="hero-art-bg"
          src={background}
          alt=""
          width={ART_W}
          height={ART_H}
          fetchPriority="high"
          decoding="async"
        />
        <div className="hero-art-band">
          <div className="hero-art-fx">
            <div
              className="hero-spin hero-ring"
              style={
                {
                  left: pctX(ART_CENTER.x - RING_R),
                  top: pctY(ART_CENTER.y - RING_R),
                  width: pctX(RING_R * 2),
                  '--spin': `${RING_SECONDS}s`,
                } as Vars
              }
            >
              <Rings />
            </div>
            {ORBITS.map((orbit) => (
              <div
                key={orbit.id}
                className="hero-spin hero-orbit"
                data-orbit={orbit.id}
                style={
                  {
                    left: pctX(ART_CENTER.x - orbit.half),
                    top: pctY(ART_CENTER.y - orbit.half),
                    width: pctX(orbit.half * 2),
                    '--spin': `${orbit.seconds}s`,
                  } as Vars
                }
              >
                {orbit.birds.map((bird, i) => (
                  <span
                    key={i}
                    className="hero-bird-arm"
                    style={{ transform: `rotate(${bird.angle}deg)` }}
                  >
                    <span
                      className="hero-bird"
                      style={
                        {
                          top: `${(50 - (bird.r / (orbit.half * 2)) * 100).toFixed(3)}%`,
                          width: `${((bird.w / (orbit.half * 2)) * 100).toFixed(3)}%`,
                          opacity: bird.opacity,
                        } as Vars
                      }
                    >
                      <LacBird className="hero-bird-svg" />
                    </span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
