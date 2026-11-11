# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Người mua quà tại Việt Nam (và Việt kiều/khách nước ngoài muốn quà mang bản sắc Việt): mua chocolate cao cấp để tặng dịp lễ, cảm ơn, đối tác. Họ muốn món quà có ý nghĩa, tự tay chọn, trình bày sang trọng.

## Product Purpose

Website thương hiệu Kinh Thành Chocolate: (1) xây dựng thương hiệu chocolate mang di sản Việt; (2) bán hộp quà tự chọn — khách chọn size hộp, chọn từng viên xếp vào ô, thêm lời nhắn, đặt hàng. Thành công = khách hoàn tất một hộp và gửi đơn.

## Positioning

Chocolate kể chuyện di sản Việt (trống đồng Đông Sơn, chim Lạc, cổng thành) và hộp quà do chính người tặng xếp từng viên.

## Operating Context

Khách thường xem trên điện thoại, thường vào buổi tối khi lên kế hoạch tặng quà. Đơn hàng giai đoạn sau gửi về Google Sheet qua Apps Script.

## Capabilities and Constraints

- Giai đoạn hiện tại chỉ frontend; đặt hàng qua `OrderService` mock.
- Hộp 6/9/12/16 viên (lưới cột×hàng: 3×2, 3×3, 4×3, 4×4). Một loại được chọn nhiều viên.
- Chưa có ảnh viên chocolate thật: dùng SVG tạm, thay bằng ảnh thật mà không sửa code.
- Website chỉ tiếng Việt (text tách riêng để thêm EN sau). Tiền tệ VND.
- CHƯA CHỐT: giá thật, tên/mô tả thật từng viên, chính sách giao hàng. Tagline tiếng Việt đã chốt: "Trọn Vẹn Tinh Hoa, Vẹn Nguyên Giá Trị".

## Brand Commitments

- Tên: Kinh Thành Chocolate. Bao bì khách cung cấp là chuẩn bắt buộc: `docs/reference/client-packaging-demo.jpg`, mô tả ở `docs/BRAND.md`.
- Hộp nâu cacao rất đậm, họa tiết foil vàng nét mảnh (trống đồng, chim Lạc, cổng thành), logo cổng thành + chữ in hoa serif giãn rộng; nắp lật bản lề; khay vàng có vách ngăn.
- Tagline gốc (EN): "The Legacy of Vietnam, Crafted in Chocolate" · "From the land of heritage, to the world".

## Evidence on Hand

- Ảnh bao bì demo (render, không phải ảnh chụp sản phẩm thật).
- KHÔNG có: ảnh sản phẩm thật, lời chứng thực khách hàng, số liệu, giải thưởng, năm thành lập, địa chỉ. Không được bịa những thứ này.

## Product Principles

- Món quà là nhân vật chính: mọi màn hình phục vụ việc chọn và trao hộp quà.
- Di sản thể hiện bằng chất liệu và họa tiết, không bằng lời khoe.
- Sang trọng là sự kiềm chế: ít yếu tố, chuyển động chậm, chi tiết chuẩn.
- Thao tác chọn viên phải dễ trên điện thoại như trên máy tính.

## Accessibility & Inclusion

WCAG 2.2 AA: tương phản chữ, thao tác bàn phím cho kéo-thả, thông báo cho screen reader, tôn trọng prefers-reduced-motion.
