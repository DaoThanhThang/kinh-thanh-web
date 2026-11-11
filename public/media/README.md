# Media của trang chủ

**Hai tệp trong thư mục này là BẢN TẠM** do đội dựng vẽ để kiểm tra bố cục. Cảnh cổng thành, chim Lạc và âm thanh ambient chỉ là minh hoạ. Hãy thay bằng video thật của thương hiệu.

| Tệp | Vai trò |
| --- | --- |
| `hero.mp4` | Video nền của hero (tự phát, tắt tiếng, lặp). |
| `hero-poster.jpg` | Hiện ngay khi tải trang, và là ảnh duy nhất khi khách bật giảm chuyển động / tiết kiệm dữ liệu / video lỗi. |
| `hero-mobile.mp4` (tuỳ chọn) | Bản riêng cho màn hình hẹp (dưới 768px). Chưa có. |

## Cách thay

1. Đặt video mới vào `public/media/hero.mp4` và ảnh mới vào `public/media/hero-poster.jpg`, GIỮ NGUYÊN TÊN. Không cần sửa code.
2. Nếu video không có tiếng: mở `src/config/media.ts`, đặt `heroVideoHasAudio: false` (nút bật/tắt âm thanh sẽ ẩn).
3. Bản mobile: thêm `public/media/hero-mobile.mp4`, rồi đặt `heroVideoMobileExists: true` trong `src/config/media.ts`. Trình duyệt màn hình hẹp sẽ dùng bản này, màn hình rộng dùng `hero.mp4`.
4. Đổi tên tệp hoặc đường dẫn: sửa `src/config/media.ts`.

## Khuyến nghị cho video

- 1920×1080, H.264 (profile High, yuv420p) trong MP4, tiếng AAC. Có `-movflags +faststart` để bắt đầu phát sớm.
- Dung lượng ≤ 8–10 MB, dài 10–20 giây, **lặp liền mạch** (khung cuối nối được với khung đầu).
- **Chủ thể đặt ở 55% bên PHẢI khung hình**: bên trái là chữ (slogan, hộp quà, nút) và được phủ lớp tối từ trái sang phải. Phần trái nên tối/êm, ít chuyển động.
- Khung đầu của video nên trùng ảnh poster để lúc video mờ dần vào không bị "nhảy".
- Bản mobile: 720p, dọc hoặc cắt sát chủ thể, ≤ 3 MB. Trên mobile nội dung xếp dọc, chữ nằm ở nửa dưới màn hình (lớp phủ từ đáy lên), nên chủ thể nên ở nửa trên.
- Tiếng nên nhỏ, êm: mặc định tắt, khách tự bật bằng nút ở góc phải dưới hero.

## Ảnh poster

- 1920×1080 JPEG, ≤ 300 KB, là khung đầu của video. Ảnh này cũng là ảnh LCP của trang chủ nên càng nhẹ càng tốt.

## Ví dụ lệnh ffmpeg (nén video có sẵn)

```
ffmpeg -i nguon.mov -vf "scale=1920:1080" -c:v libx264 -preset slow -crf 25 -pix_fmt yuv420p \
  -movflags +faststart -c:a aac -b:a 96k hero.mp4
ffmpeg -i hero.mp4 -frames:v 1 -q:v 4 hero-poster.jpg
```
