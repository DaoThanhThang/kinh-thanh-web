import { Button, Text } from '@/components/ui';
import { GiftBox } from '@/features/box-builder/components/box';
import { home } from '@/content/home';
import './story.css';

/**
 * Màn hình đầu: hộp đóng ở giữa, mặt nắp mang mặt trống và logo (h1 duy nhất của trang), dưới hộp
 * là một dòng dẫn và hành động chính cuộn tới builder.
 */
export function Hero({ cols, rows }: { cols: number; rows: number }) {
  return (
    <section className="hero" aria-label={home.heroLabel}>
      <GiftBox cols={cols} rows={rows} open={0} heading />
      <Text role="lead" className="max-w-[30ch]">
        {home.heroLine}
      </Text>
      <Button href="#builder" size="lg">
        {home.cta}
      </Button>
    </section>
  );
}
