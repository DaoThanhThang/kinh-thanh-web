/** Chữ của phần xếp hộp (tiếng Việt). */
export const builder = {
  heading: 'Xếp hộp quà của bạn',
  intro: 'Chọn cỡ hộp, rồi đặt từng viên vào ô theo ý bạn.',

  sizeLegend: 'Cỡ hộp',
  sizeLabel: (size: number) => `${size} viên`,

  boxLabel: 'Hộp quà đang xếp',
  gridLabel: (cols: number, rows: number) => `Lưới ${cols} cột, ${rows} hàng`,
  cellEmpty: (n: number) => `Ô ${n}, còn trống`,
  cellEmptySelected: (n: number) => `Ô ${n}, còn trống, đang chọn`,
  cellFilled: (n: number, name: string) => `Ô ${n}, ${name}. Bấm để xem tuỳ chọn`,

  cellMenuLabel: (n: number) => `Tuỳ chọn ô ${n}`,
  removePiece: 'Bỏ viên này',
  closeMenu: 'Đóng',

  summaryLabel: 'Tóm tắt hộp',
  progress: (filled: number, capacity: number) => `Đã chọn ${filled}/${capacity} viên`,
  priceBox: 'Hộp',
  pricePieces: 'Viên',
  priceTotal: 'Tổng',
  fillRandom: 'Chọn ngẫu nhiên phần còn lại',
  fillRandomShort: 'Chọn ngẫu nhiên',
  clearAll: 'Xoá hết',
  detailsShow: 'Chi tiết',
  detailsHideLabel: 'Thu gọn',

  confirmResizeTitle: 'Đổi cỡ hộp',
  confirmResizeBody: (size: number, dropped: number) =>
    `Hộp ${size} viên chỉ giữ được ${size} viên đầu. ${dropped} viên sẽ được bỏ ra.`,
  confirmResizeYes: 'Đổi hộp',
  confirmResizeNo: 'Giữ hộp hiện tại',
  confirmClearTitle: 'Xoá hết viên',
  confirmClearBody: (filled: number) => `${filled} viên trong hộp sẽ được bỏ ra.`,
  confirmClearYes: 'Xoá hết',
  confirmClearNo: 'Giữ lại',

  announceRemovedOnLoad: (n: number) =>
    `${n} viên đã lưu không còn trong danh mục nên đã được bỏ khỏi hộp.`,
  announcePlaced: (name: string, slot: number) => `Đã thêm ${name} vào ô ${slot}`,
  announceFull: 'Hộp đã đầy',
  announceRemoved: (name: string, slot: number) => `Đã bỏ ${name} khỏi ô ${slot}`,
  announceFilledRandom: (n: number) => `Đã điền ngẫu nhiên ${n} ô còn trống`,
  announceCleared: 'Đã xoá hết viên',
  announceResized: (size: number) => `Đã đổi sang hộp ${size} viên`,

  announceReplaced: (oldName: string, newName: string, slot: number) =>
    `Đã thay ${oldName} bằng ${newName} ở ô ${slot}`,
  announceSwapped: (a: number, b: number) => `Đã đổi chỗ ô ${a} và ô ${b}`,
  announceMoved: (name: string, from: number, to: number) =>
    `Đã chuyển ${name} từ ô ${from} sang ô ${to}`,
  announceHeld: (name: string) => `Đang cầm ${name}. Chạm vào ô trống để đặt`,
  announceReleased: 'Đã bỏ chọn viên',
  announceFullDone: 'Hộp đã đầy',
  announceCellSelected: (n: number) => `Đã chọn ô ${n}. Chọn viên trong khay để đặt vào`,
  announceCellDeselected: (n: number) => `Đã bỏ chọn ô ${n}`,

  holdHint: (name: string) => `Chạm vào ô trống để đặt ${name}`,
  holdHintMore: (name: string) => `Chạm vào ô trống để đặt thêm ${name}`,
  holdGroupLabel: 'Đang cầm một viên',
  holdCancel: 'Huỷ',
  holdDone: 'Xong',
  viewBox: 'Xem hộp',
  cellTarget: (n: number, name: string) => `Ô ${n}, còn trống. Chạm để đặt ${name}`,
  cellReplaceWith: (name: string) => `Thay bằng ${name}`,

  trayHoldLabel: (name: string) => `Cầm ${name} để đặt vào hộp`,
  trayHoldingLabel: (name: string) => `Đang cầm ${name}. Bấm để bỏ chọn`,
  trayPlaceInto: (n: number) => `Đặt vào ô ${n}`,
  trayPlaceIntoLabel: (name: string, n: number) => `Đặt ${name} vào ô ${n}`,
  trayPickPlaceLabel: (name: string, n: number) => `Chọn ${name}, đặt vào ô ${n}`,
  trayDropHint: 'Thả vào đây để bỏ viên khỏi hộp',

  dndInstructions:
    'Để kéo một viên: nhấn Space, dùng phím mũi tên để chuyển giữa các ô, nhấn Space hoặc Enter để thả, Esc để huỷ. Trên ô đã có viên, Enter mở tuỳ chọn.',
  dndRoleDescription: 'có thể kéo',
  dndStart: (name: string) => `Đã nhấc ${name}`,
  dndOverEmpty: (n: number) => `Đang ở ô ${n}, còn trống`,
  dndOverFilled: (n: number, name: string) => `Đang ở ô ${n}, có ${name}`,
  dndOverSelf: (n: number) => `Đang ở ô ${n}, chỗ cũ`,
  dndOutside: 'Ngoài hộp',
  dndOutsideRemove: 'Ngoài hộp. Thả để bỏ viên',
  dndCancel: (name: string) => `Đã huỷ. ${name} trở về chỗ cũ`,

  trayHeading: 'Khay chọn viên',
  trayHint: 'Một loại có thể chọn nhiều viên.',
  trayScrollHint: (n: number) => `${n} viên · cuộn để xem thêm`,
  trayAdd: 'Thêm',
  trayAddLabel: (name: string) => `Thêm ${name} vào hộp`,
  trayUnavailable: 'Tạm hết',
  trayFull: 'Hộp đã đầy',
  trayCount: (n: number) => `×${n}`,
  trayCountLabel: (n: number) => `${n} viên trong hộp`,
  trayInfo: (name: string) => `Xem chi tiết ${name}`,

  detailsClose: 'Đóng',
  detailsFlavor: 'Hương vị',
  detailsAllergens: 'Thông tin dị ứng',
  detailsAllergensNull: 'Thông tin dị ứng đang cập nhật',
  detailsAllergensNone: 'Không có chất gây dị ứng được ghi nhận',
  detailsContains: (list: string) => `Có chứa: ${list}`,
} as const;
