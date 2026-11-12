/** Escape văn bản người dùng trước khi đưa vào HTML. */
export function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Escape rồi giữ xuống dòng của khách (CRLF/LF/CR → <br>). */
export function escMultiline(value: string): string {
  return esc(value).replace(/\r\n|\r|\n/g, '<br>');
}

const LINE_BREAKS = new RegExp(`[\\r\\n${String.fromCharCode(0x2028, 0x2029)}]+`, 'g');
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/g;

/** Bỏ CR/LF và ký tự điều khiển khỏi giá trị đưa vào header email (chống header injection). */
export function headerSafe(value: string): string {
  return value
    .replace(LINE_BREAKS, ' ')
    .replace(CONTROL_CHARS, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
