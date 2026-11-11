/** Chữ của trang đặt hàng /dat-hang (tiếng Việt). */
export const checkout = {
  pageTitle: 'Đặt hàng',
  heading: 'Đặt hàng',
  intro: 'Kiểm tra lại hộp quà và cho Kinh Thành biết nơi nhận.',
  backToBuilder: 'Quay lại sửa hộp',
  home: 'Về trang chủ',
  loading: 'Đang mở hộp của bạn…',

  empty: {
    heading: 'Hộp của bạn chưa đầy',
    noBox:
      'Bạn chưa xếp hộp quà nào. Hãy chọn cỡ hộp và đặt các viên vào ô, rồi quay lại để đặt hàng.',
    notFull: (filled: number, size: number) =>
      `Hộp ${size} viên mới có ${filled} viên. Hãy xếp đủ ${size} viên rồi quay lại để đặt hàng.`,
    action: 'Quay lại xếp hộp',
  },

  summary: {
    heading: 'Đơn của bạn',
    boxLine: (size: number) => `Hộp ${size} viên`,
    piecesHeading: 'Các viên trong hộp',
    pieceLine: (name: string, qty: number) => `${name} × ${qty}`,
    messageHeading: 'Lời nhắn trên thiệp',
    noMessage: 'Không kèm lời nhắn.',
    to: (name: string) => `Gửi đến ${name}`,
    from: (name: string) => `Gửi từ ${name}`,
    priceBox: 'Hộp',
    pricePieces: 'Viên',
    total: 'Tổng cộng',
  },

  form: {
    heading: 'Thông tin giao hàng',
    requiredNote: 'Mục có dấu * là bắt buộc.',
    name: 'Họ tên',
    phone: 'Số điện thoại',
    phoneHint: 'Ví dụ: 0912 345 678',
    email: 'Email',
    emailHint: 'Không bắt buộc',
    address: 'Địa chỉ giao hàng',
    addressHint: 'Số nhà, đường, phường/xã, quận/huyện',
    province: 'Tỉnh / Thành phố',
    date: 'Ngày nhận mong muốn',
    dateHint: 'Không bắt buộc, từ ngày mai trở đi',
    note: 'Ghi chú',
    noteHint: 'Không bắt buộc',
    paymentLegend: 'Thanh toán',
    paymentCod: 'Thanh toán khi nhận hàng (COD)',
    paymentTransfer: 'Chuyển khoản',
    paymentTransferNote: 'Hướng dẫn chuyển khoản sẽ được gửi sau khi Kinh Thành xác nhận đơn.',
    submit: 'Gửi đơn hàng',
    submitting: 'Đang gửi đơn…',
    retry: 'Gửi lại',
    submitError:
      'Chưa gửi được đơn. Hãy kiểm tra kết nối rồi bấm gửi lại. Thông tin bạn đã nhập vẫn được giữ.',
  },

  errors: {
    nameRequired: 'Hãy nhập họ tên người đặt.',
    nameTooLong: 'Họ tên tối đa 80 ký tự. Hãy rút gọn lại.',
    phoneRequired: 'Hãy nhập số điện thoại để Kinh Thành liên hệ.',
    phoneInvalid: 'Số điện thoại cần 10 chữ số, bắt đầu bằng 0.',
    emailInvalid: 'Email chưa đúng dạng, ví dụ ten@example.com. Hãy sửa lại hoặc để trống.',
    addressRequired: 'Hãy nhập địa chỉ giao hàng, gồm số nhà, đường và phường/xã.',
    addressTooLong: 'Địa chỉ tối đa 200 ký tự. Hãy rút gọn lại.',
    provinceRequired: 'Hãy nhập tỉnh hoặc thành phố.',
    provinceTooLong: 'Tỉnh/Thành phố tối đa 60 ký tự. Hãy rút gọn lại.',
    dateInvalid: 'Ngày nhận chưa hợp lệ. Hãy chọn lại một ngày.',
    datePast: 'Ngày nhận cần từ ngày mai trở đi. Hãy chọn lại ngày.',
    noteTooLong: 'Ghi chú tối đa 500 ký tự. Hãy rút gọn lại.',
    paymentRequired: 'Hãy chọn cách thanh toán.',
  },

  success: {
    heading: 'Kinh Thành đã nhận đơn của bạn',
    orderId: 'Mã đơn',
    next: 'Kinh Thành sẽ liên hệ để xác nhận đơn.',
  },
} as const;
