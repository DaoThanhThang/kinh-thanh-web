/** Hình dạng gợi ý hộp gửi tới client (server đã kiểm và tính giá). */
export type ChatSuggestion = {
  size: number;
  cols: number;
  rows: number;
  /** id viên theo thứ tự ô, độ dài === size. */
  pieces: string[];
  /** Thông tin hiển thị của các viên khác nhau trong `pieces` (client không có catalog ở mọi trang). */
  items: { id: string; name: string; image: string; price: number }[];
  title: string;
  reason: string;
  boxPrice: number;
  total: number;
};

/** Sự kiện NDJSON: mỗi dòng một JSON. */
export type ChatEvent =
  | { type: 'text'; delta: string }
  | { type: 'suggestion'; data: ChatSuggestion }
  | { type: 'done' }
  | { type: 'error'; message: string };

export type ChatStatus = { enabled: boolean; mode: 'live' | 'mock' };
