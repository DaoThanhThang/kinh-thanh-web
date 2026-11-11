import { Button, Container, Text } from '@/components/ui';
import { GiftBox } from '@/features/box-builder/components/box';
import { media } from '@/config/media';
import { home } from '@/content/home';
import { HeroMedia } from './HeroMedia';
import './hero.css';

/**
 * Màn hình đầu: nền video/ảnh toàn khung, nội dung nằm bên TRÁI (bên phải chừa cho chủ thể của
 * video): tên thương hiệu (h1 duy nhất), slogan, dòng dẫn, hộp đóng nhỏ và nút "Đặt hàng ngay".
 * Chỉ HeroMedia là client (video, âm thanh); phần còn lại là server component.
 */
export function Hero({ cols, rows }: { cols: number; rows: number }) {
  return (
    <section className="hero" aria-label={home.heroLabel}>
      <HeroMedia
        poster={media.heroPoster}
        video={media.heroVideo}
        videoMobile={media.heroVideoMobileExists ? media.heroVideoMobile : undefined}
        hasAudio={media.heroVideoHasAudio}
      />
      <div className="hero-scrim" aria-hidden="true" />
      <Container className="hero-inner">
        <div className="hero-content">
          {/* h1 duy nhất: tên thương hiệu cho trình đọc màn hình + slogan hiển thị (không eyebrow, D51). */}
          <h1 className="hero-slogan">
            <span className="sr-only">{home.brandName}: </span>
            {home.tagline}
          </h1>
          <Text role="lead" className="hero-line">
            {home.heroLine}
          </Text>
          <div className="hero-box" aria-hidden="true">
            <GiftBox cols={cols} rows={rows} open={0} />
          </div>
          <Button href="#builder" size="lg" className="hero-cta">
            {home.cta}
          </Button>
        </div>
      </Container>
    </section>
  );
}
