/** Chữ của /lien-he, /thong-tin và thông báo "thông tin đang cập nhật" (tiếng Việt). */
export const info = {
  placeholderNotice: 'Thông tin đang được cập nhật, có thể thay đổi.',

  contact: {
    pageTitle: 'Liên hệ',
    heading: 'Liên hệ',
    intro: 'Cần tư vấn chọn hộp, hỏi ngày giao hoặc nhờ gói quà? Nhắn hoặc gọi cho Kinh Thành.',
    detailsHeading: 'Cách liên hệ',
    phone: 'Điện thoại',
    email: 'Email',
    zalo: 'Zalo',
    facebook: 'Facebook',
    address: 'Địa chỉ',
    hours: 'Giờ làm việc',
    facebookLink: 'Trang Facebook của Kinh Thành',
    zaloLink: (phone: string) => `Nhắn Zalo ${phone}`,
  },

  form: {
    heading: 'Gửi lời nhắn',
    requiredNote: 'Ô có dấu * là bắt buộc.',
    name: 'Họ và tên',
    contact: 'Số điện thoại hoặc email',
    contactHint: 'Để Kinh Thành trả lời bạn.',
    message: 'Nội dung',
    submit: 'Gửi lời nhắn',
    submitting: 'Đang gửi…',
    retry: 'Gửi lại',
    submitError:
      'Chưa gửi được lời nhắn. Bạn thử lại sau ít phút hoặc gọi trực tiếp cho Kinh Thành.',
    successHeading: 'Kinh Thành đã nhận lời nhắn của bạn',
    successBody: 'Kinh Thành sẽ phản hồi qua thông tin bạn để lại trong giờ làm việc.',
    another: 'Gửi lời nhắn khác',
    errors: {
      nameRequired: 'Hãy nhập họ và tên.',
      nameTooLong: 'Họ và tên tối đa 80 ký tự.',
      contactRequired: 'Hãy nhập số điện thoại hoặc email để Kinh Thành trả lời.',
      contactInvalid: 'Số điện thoại gồm 10 chữ số bắt đầu bằng 0, hoặc email dạng ten@vi-du.com.',
      messageRequired: 'Hãy nhập nội dung bạn muốn hỏi.',
      messageTooLong: 'Nội dung tối đa 1000 ký tự.',
    },
  },

  page: {
    pageTitle: 'Thông tin',
    heading: 'Thông tin cần biết',
    intro: 'Giao hàng, đổi trả, cách giữ chocolate và những câu hỏi thường gặp.',
    faqHeading: 'Câu hỏi thường gặp',
    shippingHeading: 'Giao hàng và đổi trả',
    shippingAreas: 'Khu vực giao',
    shippingLead: 'Thời gian giao',
    shippingFee: 'Phí giao hàng',
    shippingPack: 'Đóng gói',
    returnsHeading: 'Đổi trả',
    storageHeading: 'Bảo quản chocolate',
    contactCta: 'Chưa thấy câu trả lời? Liên hệ Kinh Thành',
  },
} as const;
