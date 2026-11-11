import { siteConfig } from '@/config/site';
import { CitadelPanorama } from './art/CitadelPanorama';
import { LacBird } from './art/LacBird';
import { Waves } from './art/Waves';

/** Mặt trong nắp: cổng thành lớn, vài cánh chim, tagline in nghiêng. Đặt vào `BoxLid inner`. */
export function LidInner() {
  return (
    <>
      <LacBird
        className="gb-art gb-foil"
        style={{ left: '16%', top: '10%', width: '12%', transform: 'rotate(-10deg)' }}
      />
      <LacBird
        className="gb-art gb-foil"
        style={{ left: '76%', top: '8%', width: '10%', transform: 'rotate(6deg)' }}
      />
      <LacBird
        className="gb-art gb-foil"
        style={{ left: '84%', top: '30%', width: '6%', opacity: 0.7 }}
      />
      <CitadelPanorama className="gb-art gb-foil gb-gate" />
      <Waves className="gb-art gb-waves gb-waves-soft gb-foil" />
      <p className="gb-tagline gb-tagline-inner">{siteConfig.tagline}</p>
      <div className="gb-sheen gb-sheen-inner" aria-hidden="true" />
    </>
  );
}
