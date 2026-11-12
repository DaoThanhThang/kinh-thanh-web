import storeRaw from '../../../../data/store-info.json';
import { BOXES, CHOCOLATES } from '@/lib/order-server/__tests__/fixtures';
import { storeInfoSchema, type StoreInfo } from '@/lib/schemas/store-info';

export { BOXES, CHOCOLATES };
export const STORE: StoreInfo = storeInfoSchema.parse(storeRaw);

export type Ev = { type: string; [k: string]: unknown };

/** Đọc toàn bộ thân NDJSON thành mảng sự kiện. */
export async function readNdjson(res: Response): Promise<Ev[]> {
  const text = await res.text();
  return text
    .split('\n')
    .filter(Boolean)
    .map((l) => JSON.parse(l) as Ev);
}
