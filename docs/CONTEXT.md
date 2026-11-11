# CONTEXT – Kinh Thành (website chocolate cao cấp)

## Mục tiêu
Xây dựng thương hiệu mạnh + bán hộp quà chocolate tự chọn.
Khách chọn size hộp → xếp TỪNG VIÊN vào ô → thêm lời nhắn → đặt hàng.
Giai đoạn hiện tại: CHỈ frontend. Gửi đơn qua `OrderService` (interface), dùng mock; sau này thay bằng Google Apps Script (Google Sheet).

## Trải nghiệm
- Hero: nền video (có nút bật tiếng), slogan, hộp quà đóng nhỏ và nút "Đặt hàng ngay" bên trái.
- Thứ tự trang: Hero (video nền) → Câu chuyện → Hộp quà mở nắp khi cuộn tới và chính là phần xếp hộp (D41, D42).
- Builder (section thường, không chiếm quyền cuộn): size 6/9/12/16 (3×2, 3×3, 4×3, 4×4 — cột×hàng); kéo-thả desktop, chạm-để-chọn mobile; hiệu ứng rơi nhẹ.
- Hộp đầy: nắp đóng → ruy băng → lời nhắn → tóm tắt + đặt hàng.
- Hỗ trợ prefers-reduced-motion và bàn phím.

## Luật nghiệp vụ
- Một loại được chọn nhiều viên. Giá = giá hộp theo size + tổng giá viên (VND).
- Bỏ viên: bấm vào viên hoặc kéo ra ngoài. Nút "Chọn ngẫu nhiên phần còn lại".
- Đổi size khi đã có viên: hỏi xác nhận, giữ các viên vừa hộp mới.
- Lời nhắn ≤ 150 ký tự. Lưu trạng thái hộp vào localStorage.

## Thiết kế
XEM docs/BRAND.md (theo ảnh bao bì khách gửi). Nền tối nâu cacao chủ đạo, foil vàng champagne, kem ngà phụ. Họa tiết trống đồng, chim Lạc, cổng thành. Nắp hộp lật quanh bản lề.
Trang trọng, tối giản, nhiều khoảng trắng, chuyển động chậm.
Tiêu đề: Noto Serif Display. Nội dung: Be Vietnam Pro (D14). Quy tắc thiết kế: docs/DESIGN-RULES.md. Mọi token trong `src/styles/tokens`. Màu chữ đạt WCAG AA.

## Dữ liệu
- `/public/chocolates/01.svg…12.svg` (ảnh tạm).
- `data/chocolates.json`: id, name, price, image, description, flavorNotes, allergens, available, sortOrder.
- `data/boxes.json`: size, cols, rows, price.
- Validate bằng Zod; thiếu ảnh → fallback. Thay ảnh/thêm viên KHÔNG sửa code.

## Quy trình
Mỗi lần 1 task → báo cáo (file đã đổi · cách kiểm tra · tồn đọng) → CHỜ DUYỆT.
Đầu phiên: đọc CONTEXT.md, TASKS.md, DECISIONS.md. Không tự cài thư viện ngoài danh sách.
