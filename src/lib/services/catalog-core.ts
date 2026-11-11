import type { ZodType } from 'zod';
import { boxSchema, type BoxOption } from '@/lib/schemas/box';
import { chocolateSchema, type Chocolate } from '@/lib/schemas/chocolate';

export const FALLBACK_IMAGE = '/chocolates/fallback.svg';

/** Hợp đồng nguồn dữ liệu. Bản JSON hiện tại và bản Google Sheet sau này cùng cài interface này. */
export interface CatalogService {
  getChocolates(): Promise<Chocolate[]>;
  getChocolateById(id: string): Promise<Chocolate | undefined>;
  getBoxOptions(): Promise<BoxOption[]>;
}

type Warn = (message: string) => void;

/** Kiểm từng phần tử riêng: phần tử lỗi bị bỏ qua và báo rõ (file, vị trí, id, đường dẫn lỗi). */
function parseEach<T>(
  raw: unknown,
  schema: ZodType<T>,
  file: string,
  idOf: (item: unknown) => string,
  warn: Warn,
): { item: T; index: number }[] {
  if (!Array.isArray(raw)) {
    warn(`[catalog] ${file}: dữ liệu phải là một mảng, bỏ qua toàn bộ file.`);
    return [];
  }
  const out: { item: T; index: number }[] = [];
  raw.forEach((entry, index) => {
    const result = schema.safeParse(entry);
    if (result.success) {
      out.push({ item: result.data, index });
      return;
    }
    const issues = result.error.issues
      .map((i) => `${i.path.join('.') || '(gốc)'}: ${i.message}`)
      .join('; ');
    warn(`[catalog] ${file}[${index}] (${idOf(entry)}) bị bỏ qua: ${issues}`);
  });
  return out;
}

function idOfChocolate(entry: unknown): string {
  const id = (entry as { id?: unknown } | null)?.id;
  return `id=${typeof id === 'string' || typeof id === 'number' ? id : '?'}`;
}

function idOfBox(entry: unknown): string {
  const size = (entry as { size?: unknown } | null)?.size;
  return `size=${typeof size === 'number' ? size : '?'}`;
}

export type CatalogOptions = {
  /** Trả true nếu file ảnh nội bộ (đường dẫn bắt đầu bằng "/") tồn tại trong /public. */
  exists: (publicPath: string) => boolean;
  warn?: Warn;
};

export function normalizeChocolates(raw: unknown, opts: CatalogOptions): Chocolate[] {
  const warn = opts.warn ?? (() => {});
  const seen = new Set<string>();
  const list: Chocolate[] = [];
  for (const { item, index } of parseEach(
    raw,
    chocolateSchema,
    'data/chocolates.json',
    idOfChocolate,
    warn,
  )) {
    if (seen.has(item.id)) {
      warn(`[catalog] data/chocolates.json[${index}] (id=${item.id}) trùng id, giữ viên đầu tiên.`);
      continue;
    }
    seen.add(item.id);
    let image = item.image;
    if (image.startsWith('/') && !opts.exists(image)) {
      warn(
        `[catalog] data/chocolates.json[${index}] (id=${item.id}): không thấy file ảnh public${image}, dùng ảnh thay thế.`,
      );
      image = FALLBACK_IMAGE;
    }
    list.push({ ...item, image });
  }
  return list.sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
}

export function normalizeBoxes(raw: unknown, warn: Warn = () => {}): BoxOption[] {
  const seen = new Set<number>();
  const list: BoxOption[] = [];
  for (const { item, index } of parseEach(raw, boxSchema, 'data/boxes.json', idOfBox, warn)) {
    if (seen.has(item.size)) {
      warn(`[catalog] data/boxes.json[${index}] (size=${item.size}) trùng size, giữ hộp đầu tiên.`);
      continue;
    }
    seen.add(item.size);
    list.push(item);
  }
  return list.sort((a, b) => a.size - b.size);
}
