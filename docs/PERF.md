# Đo hiệu năng cuộn trên mobile (R1)

## Cách đo

Playwright Chromium, giả lập điện thoại: 390×844, `isMobile`, `hasTouch`, `deviceScaleFactor` 3, CDP `Emulation.setCPUThrottlingRate` = 4. Bản build production (`npm run build && npm run start`). Hai kiểu cuộn từ đầu tới cuối trang, mỗi kiểu 3 lần:

- **rAF**: `scrollTo` trong vòng `requestAnimationFrame` đều đặn trong 8 giây.
- **Chạm**: chuỗi `Input.dispatchTouchEvent` (touchStart, nhiều touchMove cách 16ms, touchEnd) lặp lại như người vuốt, đi qua đường cuộn của compositor.

Trong lúc cuộn, một vòng rAF ghi khoảng cách giữa các khung (FPS trung bình, số khung > 33 ms, > 50 ms, p95, khung dài nhất) và `PerformanceObserver` ghi `longtask`.

## Kết quả (3 lần chạy mỗi dòng)

| Bản | Kiểu | Chiều cao trang | FPS trung bình | Khung > 33 ms | Khung > 50 ms | Longtask |
| --- | --- | --- | --- | --- | --- | --- |
| TRƯỚC (có cảnh scrub 230svh) | rAF | 6740 px | 58.6 / 58.5 / 59.3 | 1 / 0 / 0 | 0 / 0 / 0 (0%) | 0 |
| TRƯỚC | Chạm | 6740 px | 54.0 / 52.7 / 55.1 | 3 / 10 / 1 | 0 / 1 / 0 (≤ 0.2%) | 0 |
| SAU (poster, video không phát vì Chromium của Playwright không có H.264) | rAF | 4799 px | 57.1 / 57.5 / 57.8 | 2 / 0 / 2 | 0 / 0 / 2 (≤ 0.4%) | 0 / 0 / 2 (134 ms) |
| SAU | Chạm | 4799 px | 55.6 / 55.0 / 55.8 | 0 / 3 / 2 | 0 / 0 / 1 (≤ 0.2%) | 0 |
| SAU, video chạy (thay bằng bản VP9 cùng nội dung, chỉ để đo) | rAF | 4799 px | 59.4 / 59.0 / 59.1 | 0 / 0 / 0 | 0 / 0 / 0 | 0 |
| SAU, video chạy | Chạm | 4799 px | 54.9 / 56.0 / 55.4 | 3 / 1 / 1 | 0 / 0 / 1 (≤ 0.2%) | 0 |

Mục tiêu (≥ 50 FPS trung bình và < 3% khung > 50 ms) đạt ở cả TRƯỚC lẫn SAU trong bộ đo này.

## Đọc kết quả cho trung thực

- Bộ đo này **không tái hiện được cảnh khựng** mà khách thấy: Chromium headless raster bằng phần mềm, không có GPU thật, và vòng rAF chỉ thấy phần việc của luồng chính. TRƯỚC đã nằm trong mục tiêu nên không có "cải thiện" nào đo được; chênh lệch giữa các dòng (±2 FPS) nằm trong độ nhiễu giữa các lần chạy.
- Chiều cao trang SAU thấp hơn (4799 so với 6740 px) vì bỏ cảnh 230svh; cùng 8 giây cuộn nên tốc độ cuộn (px/giây) SAU chậm hơn, các dòng không so ngang hàng hoàn toàn.
- Vì vậy các sửa dưới đây dựa trên nguyên nhân đã biết (xem D49), không phải trên số đo: (1) bỏ cảnh scrub có sticky dài và biến đổi 3D tính lại mỗi khung cuộn; (2) `LazyTouchSensor`: dnd-kit mặc định gắn một listener `touchmove` KHÔNG passive lên window ngay khi trang tải, nghĩa là trên máy thật mọi lần vuốt phải chờ luồng chính phản hồi trước khi cuộn; nay chỉ gắn khi ngón tay chạm đúng phần tử kéo được; (3) `content-visibility: auto` cho "Câu chuyện" (nhiều SVG); (4) mở nắp chỉ chạy một lần bằng CSS transition và không còn đổi `margin-top` (bố cục) trong lúc chạy; (5) video dừng khi hero ra khỏi khung nhìn.
- Đề nghị đo lại trên điện thoại thật (Chrome remote debugging, bảng Performance) trước khi kết luận với khách.

## Đã kiểm tra, không phải nguyên nhân

- Thớ giấy ở `body` là tile SVG 160px lặp bình thường (không `background-attachment: fixed`, không lớp fixed toàn trang).
- Không có scroll listener nào: thanh đầu trang, hero, hộp builder đều dùng IntersectionObserver; header chỉ đổi màu nền/viền (không `backdrop-filter`).
- Thanh tóm tắt mobile dính bằng CSS `position: sticky`, không JS.
