# DESIGN RULES (rút từ skill impeccable + taste-skill, đã lọc theo brief)

Nguyên tắc gốc: **brief của khách thắng** (impeccable "The brief wins"). Luật nào của taste-skill mâu thuẫn với brief (vd "trang tối chỉ dành cho web công nghệ", "dùng ảnh stock thay sản phẩm", "không scene/hoạt ảnh") thì bỏ.
Trước mỗi lần sửa UI: đọc lại file này + `.claude/skills/impeccable/reference/craft-floor.md`.

## Cấm (ban)
- Eyebrow/kicker (dòng chữ nhỏ phía trên tiêu đề). Logo lockup "KINH THÀNH / CHOCOLATE" là ngoại lệ vì là logo.
- Đánh số section 01/02/03; gradient text; glass/blur trang trí; viền màu trái/phải > 1px; bóng đổ cứng không blur.
- Emoji/ký tự unicode làm icon — icon là SVG tự vẽ, cùng độ dày nét.
- Lưới thẻ đều nhau (icon + tiêu đề + text) làm khung trang; thẻ lồng thẻ.
- Fade-in trên mọi section; parallax chữ; scroll-jacking; nhấp nháy.
- Màu tím/lavender bất kỳ đâu.
- Bịa: số liệu, lời chứng thực, giải thưởng, "Từ năm …", tên người, địa chỉ, số điện thoại thật.

## Bắt buộc kiểm
- Tương phản: chữ thường ≥ 4.5:1, chữ lớn ≥ 3:1. Chữ phụ trên nền màu: pha từ màu nền/màu chữ, không dùng xám trung tính.
- Bóng: có offset + blur mềm.
- Khoảng cách: nhóm chặt, phân tách rộng; khoảng trên tiêu đề > khoảng dưới.
- Chữ: đoạn văn 45–75ch; body ≥ 16px; display ≤ 6rem; tracking ≥ -0.04em. Chữ sáng trên nền tối: tăng nhẹ line-height + tracking.
- Bề mặt trình duyệt: theme `::selection`, caret, scrollbar, focus ring, underline offset, số tabular cho giá.
- Trạng thái: hover, active, disabled, loading, error, empty, focus bàn phím.
- Chuyển động: MỘT khoảnh khắc chính (mở nắp), ease-out dạng exponential, nội dung hiển thị sẵn trước khi animate. Hover tinh tế: nút "bước" khi hover và "nhấn" khi click, gạch chân vẽ ra.

## Chữ & lời (copy)
- Tiếng Việt tự nhiên, cụ thể, giọng của Kinh Thành; nút gọi tên hành động ("Thêm vào hộp", "Đặt hàng").
- Tránh: từ sáo rỗng ("hành trình", "trải nghiệm đỉnh cao", "khám phá thế giới…"), câu kiểu "Không X, không Y", tiêu đề hai mảnh "X. Y.", dải số liệu, lạm dụng gạch ngang dài, dấu chấm than.
- Lỗi phải nêu vấn đề + cách khắc phục.

## Hiệu năng
Font tự host, chỉ tải weight dùng tới; lazy-load GSAP/dnd-kit; không CLS; Lighthouse mobile ≥ 90.
