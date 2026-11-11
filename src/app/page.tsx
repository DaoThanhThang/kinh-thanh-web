import { getBoxOptions, getChocolates } from '@/lib/services/catalog';
import { Builder } from '@/features/box-builder/components/builder/Builder';
import { Hero } from '@/features/storytelling/Hero';
import { Story } from '@/features/storytelling/Story';

/** Hộp mặc định cho hero: cỡ 12 (D12), dự phòng 4×3 nếu dữ liệu thiếu. */
const DEFAULT_SIZE = 12;

export default async function Home() {
  const [boxes, chocolates] = await Promise.all([getBoxOptions(), getChocolates()]);
  const box = boxes.find((b) => b.size === DEFAULT_SIZE) ?? boxes[0];
  const cols = box?.cols ?? 4;
  const rows = box?.rows ?? 3;
  return (
    <main id="main">
      <Hero cols={cols} rows={rows} />
      <Story />
      <Builder chocolates={chocolates} boxes={boxes} />
    </main>
  );
}
