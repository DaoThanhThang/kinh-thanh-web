import { Logo } from '@/components/ui';
import { siteConfig } from '@/config/site';
import { DongSonDrum } from './art/DongSonDrum';
import { LacBird } from './art/LacBird';
import { Waves } from './art/Waves';

/** Mặt ngoài nắp: mặt trống, chim Lạc, sóng, logo và tagline. Chỉ nét mảnh màu foil. */
export function LidOuterFace({
  heading = false,
  overlay,
}: {
  heading?: boolean;
  /** Phủ lên trên họa tiết (ví dụ ruy băng), dưới lớp ánh sáng. */
  overlay?: React.ReactNode;
}) {
  const logo = <Logo size="fluid" />;
  return (
    <div className="gb-face gb-lid-outer">
      <div className="gb-art gb-drum-wrap" aria-hidden="true">
        <div className="gb-drum">
          <DongSonDrum className="gb-foil" />
        </div>
      </div>
      <Waves className="gb-art gb-waves gb-foil" />
      <LacBird className="gb-art gb-foil" style={{ left: '84%', top: '9%', width: '12%' }} />
      <LacBird
        className="gb-art gb-foil"
        style={{ left: '56%', top: '17%', width: '7%', transform: 'rotate(-14deg)', opacity: 0.8 }}
      />
      <LacBird
        className="gb-art gb-foil"
        style={{
          left: '66%',
          top: '71%',
          width: '7%',
          transform: 'rotate(8deg) scaleX(-1)',
          opacity: 0.8,
        }}
      />
      <div className="gb-lockup">
        {heading ? <h1>{logo}</h1> : logo}
        <p className="gb-tagline" aria-hidden={heading ? undefined : true}>
          {siteConfig.tagline}
        </p>
      </div>
      {overlay}
      <div className="gb-sheen" aria-hidden="true" />
    </div>
  );
}

/**
 * Nắp hộp: bản lề ở cạnh trên (sau), xoay quanh trục X theo `--open` (0 đóng → 1 mở).
 * Hai mặt lưng chạm lưng (backface-visibility: hidden): mặt ngoài khi đóng, mặt trong khi mở.
 * `inner` là nội dung mặt trong (LidInner).
 */
export function BoxLid({
  heading = false,
  inner,
  overlay,
}: {
  /** Bọc logo trên nắp bằng h1 (chỉ dùng ở Hero). */
  heading?: boolean;
  inner?: React.ReactNode;
  /** Phủ lên mặt ngoài nắp (ruy băng). */
  overlay?: React.ReactNode;
}) {
  return (
    <div className="gb-lid" data-part="lid">
      <LidOuterFace heading={heading} overlay={overlay} />
      <div className="gb-face gb-lid-inner-face">{inner}</div>
      <div className="gb-lid-lip" aria-hidden="true" />
    </div>
  );
}
