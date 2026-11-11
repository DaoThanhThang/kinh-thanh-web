/**
 * Máy trạng thái bước "Hoàn tất" (T11), hàm thuần để dễ test.
 *
 *   edit ──full──▶ closing ──lid closed──▶ tying ──ribbon tied──▶ ready
 *    ▲                                                              │
 *    └──── opened ◀── opening ◀──────────── reopen ─────────────────┘
 *
 * - `closing`: nắp đóng (--open 1 → 0), `tying`: ruy băng vẽ ra, `ready`: hiện thiệp lời nhắn.
 * - Hộp không còn đầy (bỏ viên, đổi cỡ, xoá hết) ở bất kỳ pha nào → về `edit` ngay.
 * - Sau khi người dùng chủ động "Mở hộp để sửa" (`reopened`), hộp vẫn đầy nhưng KHÔNG tự đóng lại
 *   cho tới khi hộp hết đầy rồi đầy lại (để họ sửa lời nhắn, đổi chỗ viên mà không bị đóng nắp).
 * - `instant`: hộp đã đầy ngay khi tải trang (state lưu) → nhảy thẳng tới `ready`, không chạy hoạt ảnh.
 */
export type CompletionPhase = 'edit' | 'closing' | 'tying' | 'ready' | 'opening';

export type CompletionState = {
  phase: CompletionPhase;
  reopened: boolean;
  instant: boolean;
};

export type CompletionEvent =
  | { type: 'full'; onLoad?: boolean }
  | { type: 'notFull' }
  | { type: 'lidClosed' }
  | { type: 'ribbonTied' }
  | { type: 'reopen' }
  | { type: 'lidOpened' };

export const initialCompletion: CompletionState = {
  phase: 'edit',
  reopened: false,
  instant: false,
};

export function completionReducer(state: CompletionState, event: CompletionEvent): CompletionState {
  switch (event.type) {
    case 'full':
      if (state.phase !== 'edit' || state.reopened) return state;
      return event.onLoad
        ? { phase: 'ready', reopened: false, instant: true }
        : { phase: 'closing', reopened: false, instant: false };
    case 'notFull':
      return state.phase === 'edit' && !state.reopened && !state.instant
        ? state
        : initialCompletion;
    case 'lidClosed':
      return state.phase === 'closing' ? { ...state, phase: 'tying' } : state;
    case 'ribbonTied':
      return state.phase === 'tying' ? { ...state, phase: 'ready' } : state;
    case 'reopen':
      return state.phase === 'edit' || state.phase === 'opening'
        ? state
        : { phase: 'opening', reopened: true, instant: false };
    case 'lidOpened':
      return state.phase === 'opening' ? { ...state, phase: 'edit' } : state;
  }
}

/** Thời lượng (ms) từng pha; khớp với builder.css / ribbon.css. */
export const COMPLETION_MS = {
  /** Nắp đóng: --open 1 → 0, ease-in-out-soft. */
  lid: 1200,
  /** Ruy băng vẽ ra. */
  ribbon: 900,
} as const;
