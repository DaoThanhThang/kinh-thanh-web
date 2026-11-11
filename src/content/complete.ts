/** Chữ của bước "Hoàn tất" trong builder (tiếng Việt). */
export const complete = {
  heading: 'Hoàn tất hộp quà',
  statusClosing: 'Đang đóng hộp…',
  statusTying: 'Đang thắt ruy băng…',
  statusOpening: 'Đang mở hộp…',
  lead: 'Hộp đã đóng và thắt ruy băng. Bạn có thể viết vài dòng để gửi kèm thiệp.',

  announceClosing: 'Hộp đã đầy. Đang đóng hộp.',
  announceReady: 'Hộp đã đóng và thắt ruy băng. Có thể viết lời nhắn cho thiệp.',
  announceReopened: 'Đã mở hộp, bạn có thể sửa các viên.',

  cardLabel: 'Thiệp kèm hộp quà',
  previewLabel: 'Xem trước thiệp',
  cardEmpty: 'Lời nhắn của bạn sẽ hiện ở đây.',
  cardTo: (name: string) => `Gửi đến ${name}`,
  cardFrom: (name: string) => `Gửi từ ${name}`,

  messageLabel: 'Lời nhắn',
  messageOptional: 'không bắt buộc',
  messagePlaceholder: 'Ví dụ: Chúc mừng sinh nhật, mong bạn một ngày thật ngọt.',
  counter: (n: number, max: number) => `${n}/${max}`,
  toLabel: 'Gửi đến',
  toPlaceholder: 'Tên người nhận',
  fromLabel: 'Gửi từ',
  fromPlaceholder: 'Tên của bạn',

  boxLine: (size: number) => `Hộp ${size} viên`,
  total: 'Tổng',
  reopen: 'Mở hộp để sửa',
  next: 'Tiếp tục đặt hàng',
} as const;
