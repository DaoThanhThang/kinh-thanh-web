Tính năng kể chuyện thương hiệu: hero (nền video) và phần "Câu chuyện". Thứ tự trang: Hero → Câu chuyện → Builder (D41).

## Thành phần

- `Hero.tsx` (server): nền + lớp phủ + nội dung bên trái (h1 tên thương hiệu, slogan, dòng dẫn, hộp đóng nhỏ, nút "Đặt hàng ngay" → `#builder`).
- `HeroMedia.tsx` (client): poster `<img>` + `<video>` + nút bật/tắt âm thanh. Đường dẫn file ở `src/config/media.ts`. Giảm chuyển động / Save-Data → chỉ poster. Dừng khi ra khỏi khung nhìn (D45).
- `Story.tsx` (server): "Câu chuyện", nền kem ngà (D38); `content-visibility: auto` (D49).
- `hero.css`, `story.css`: bố cục. Hộp quà nằm ở `features/box-builder/components/box/`; cảnh mở nắp nay là một phần của builder (`useBoxArrival`, D47), không còn cảnh scroll-scrub.

Thay video/poster: xem `public/media/README.md`.
