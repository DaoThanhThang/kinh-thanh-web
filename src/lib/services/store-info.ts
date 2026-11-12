// Chỉ chạy phía server (JSON tĩnh). Chatbot (T18) cũng đọc qua getStoreInfo().
import raw from '../../../data/store-info.json';
import type { StoreInfo } from '@/lib/schemas/store-info';
import { normalizeStoreInfo } from './store-info-core';

export type { StoreInfo } from '@/lib/schemas/store-info';
export { telHref, zaloUrl } from './store-info-core';

/** Thông tin cửa hàng đã kiểm Zod. Không bao giờ ném lỗi: dữ liệu sai → bản rỗng + cảnh báo. */
export async function getStoreInfo(): Promise<StoreInfo> {
  return normalizeStoreInfo(raw, (m) => console.warn(m));
}
