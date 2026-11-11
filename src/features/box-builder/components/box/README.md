# Hộp quà (SVG/CSS 2.5D)

`GiftBox` ghép: `BoxBase` (thân, thành trước) chứa `Tray` (khay vàng `cols × rows`, `renderCell(i)` đặt viên vào ô), `BoxLid` (mặt ngoài: trống đồng, chim Lạc, sóng, logo, tagline) và `LidInner` (mặt trong: cổng thành, chim, tagline). `geometry.ts` tính tỉ lệ hộp từ lưới. Họa tiết trong `art/`, nét mảnh theo `currentColor`.

`--open` (0..1) điều khiển nắp; truyền prop `open` hoặc để kế thừa từ phần tử cha. Chiều rộng hộp: ghi đè `--bw` trên `.gb`.
