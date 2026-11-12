/** Chữ của trợ lý tư vấn (T18): widget, thông báo lỗi từ server (tiếng Việt). */
export const chat = {
  launcher: 'Tư vấn quà',
  launcherLabel: 'Mở trợ lý tư vấn quà',
  panelTitle: 'Kinh Thành tư vấn',
  close: 'Đóng',
  closeLabel: 'Đóng trợ lý tư vấn',
  restart: 'Bắt đầu lại',
  greeting:
    'Chào bạn, mình là trợ lý tư vấn của Kinh Thành. Bạn đang tìm quà tặng cho dịp nào, hay cần mình gợi ý viên chocolate hợp khẩu vị?',
  quickReplies: [
    'Gợi ý hộp quà tặng sinh nhật',
    'Quà tặng đối tác khoảng 500 nghìn',
    'Viên nào ít ngọt?',
  ],
  quickRepliesLabel: 'Câu hỏi gợi ý',
  messagesLabel: 'Cuộc trò chuyện',
  inputLabel: 'Tin nhắn của bạn',
  inputPlaceholder: 'Nhập câu hỏi của bạn',
  send: 'Gửi',
  stop: 'Dừng',
  typing: 'Kinh Thành đang trả lời',
  youSaid: 'Bạn',
  assistantSaid: 'Kinh Thành',
  counter: (n: number, max: number) => `${n}/${max}`,
  retry: 'Thử lại',
  stopped: 'Đã dừng',
  footnote: 'Trợ lý AI có thể nhầm. Không nhập thông tin cá nhân nhạy cảm.',
  mockNote: 'Chế độ thử: câu trả lời mẫu, chưa kết nối AI.',
  announceDone: (text: string) => `Kinh Thành trả lời: ${text}`,
  announceSuggestion: 'Kinh Thành vừa gợi ý một hộp quà.',

  suggestion: {
    heading: 'Gợi ý hộp quà',
    previewLabel: (title: string, size: number) => `Hộp ${size} viên: ${title}`,
    total: 'Tổng cộng',
    boxPrice: (v: string) => `Hộp ${v}`,
    apply: 'Xếp hộp này cho tôi',
    showPieces: 'Xem từng viên',
    hidePieces: 'Thu gọn danh sách',
    piecesLabel: 'Các viên trong hộp',
    applied: 'Đã xếp vào hộp của bạn',
    confirmTitle: 'Thay hộp đang xếp?',
    confirmBody: (filled: number) =>
      `Hộp hiện tại đang có ${filled} viên. Xếp theo gợi ý sẽ thay thế toàn bộ các viên đó.`,
    confirmYes: 'Thay bằng gợi ý',
    confirmNo: 'Giữ hộp hiện tại',
  },

  /** Thông báo lỗi do server trả về (và lỗi mạng ở client). */
  errors: {
    disabled: 'Trợ lý tư vấn đang tạm nghỉ. Bạn vui lòng quay lại sau hoặc liên hệ Kinh Thành.',
    notConfigured: 'Trợ lý tư vấn chưa sẵn sàng. Bạn vui lòng liên hệ Kinh Thành để được hỗ trợ.',
    forbidden: 'Yêu cầu không hợp lệ.',
    unsupportedType: 'Yêu cầu không hợp lệ.',
    tooLarge: 'Tin nhắn quá dài. Bạn hãy rút gọn hoặc bắt đầu lại cuộc trò chuyện.',
    invalidJson: 'Yêu cầu không hợp lệ.',
    invalidData: 'Tin nhắn chưa hợp lệ. Mỗi tin tối đa 600 ký tự, bạn hãy kiểm tra lại.',
    tooManyRequests: 'Bạn nhắn hơi nhanh. Vui lòng chờ một lát rồi thử lại.',
    busy: 'Trợ lý đang bận. Bạn vui lòng thử lại sau ít phút.',
    failed: 'Có lỗi khi trả lời. Bạn vui lòng thử lại.',
    network: 'Không kết nối được. Bạn kiểm tra mạng rồi thử lại nhé.',
    emptyReply: 'Mình chưa trả lời được câu này. Bạn thử diễn đạt lại giúp mình nhé.',
    badSuggestion:
      'Mình chưa xếp được một hộp phù hợp từ các viên hiện có. Bạn cho mình biết thêm về khẩu vị hoặc ngân sách nhé.',
  },
} as const;

/** Giới hạn dùng chung cho server và client. */
export const CHAT_LIMITS = {
  maxMessages: 16,
  userMax: 600,
  assistantMax: 2000,
} as const;
