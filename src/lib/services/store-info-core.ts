import { storeInfoSchema, type StoreInfo } from '@/lib/schemas/store-info';

/** Dùng khi file JSON hỏng: trang vẫn hiển thị, các mục để trống bị ẩn. */
export const EMPTY_STORE_INFO: StoreInfo = {
  placeholder: true,
  contact: { phone: '', email: '', address: '', hours: '', zalo: '', facebook: '' },
  shipping: { areas: [], leadTime: '', fee: '', packaging: '' },
  returns: { policy: '' },
  storage: { tips: [] },
  faq: [],
};

/** Kiểm dữ liệu thô. Sai → cảnh báo (đường dẫn trường + lý do) và trả bản rỗng, không ném lỗi. */
export function normalizeStoreInfo(raw: unknown, warn: (message: string) => void): StoreInfo {
  const result = storeInfoSchema.safeParse(raw);
  if (result.success) return result.data;
  const issues = result.error.issues
    .map((i) => `${i.path.join('.') || '(gốc)'}: ${i.message}`)
    .join('; ');
  warn(`[store-info] data/store-info.json không hợp lệ, dùng thông tin rỗng: ${issues}`);
  return EMPTY_STORE_INFO;
}

/** Đường dẫn Zalo từ số điện thoại/zalo; rỗng nếu không có chữ số. */
export function zaloUrl(zalo: string): string | null {
  const digits = zalo.replace(/\D/g, '');
  return digits ? `https://zalo.me/${digits}` : null;
}

/** Chữ số cho liên kết tel: ("0900 000 000" → "0900000000"). */
export function telHref(phone: string): string | null {
  const digits = phone.replace(/[^\d+]/g, '');
  return digits ? `tel:${digits}` : null;
}
