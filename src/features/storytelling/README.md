Tính năng kể chuyện thương hiệu: hero (nền art hoặc video) và phần "Câu chuyện". Thứ tự trang: Hero → Câu chuyện → Builder (D41).

## Thành phần

- `Hero.tsx` (server): nền + lớp phủ + nội dung bên trái (h1 tên thương hiệu, slogan, dòng dẫn, hộp đóng nhỏ, nút "Đặt hàng ngay" → `#builder`).
- `HeroMedia.tsx` (client): chọn nền theo `media.heroMode`. `'video'`: poster `<img>` + `<video>` + nút bật/tắt âm thanh (D45). `'art'` (mặc định): `HeroArt.tsx`, không có video và không có nút âm thanh (D66).
- `HeroArt.tsx` + `heroArt.ts` (hình học dùng chung với `scripts/make-hero-citadel.tsx`) + `heroMotion.ts`: ảnh tĩnh `hero-citadel.jpg` và ba lớp xoay (vòng, hai quỹ đạo chim). Đường dẫn file ở `src/config/media.ts`.
- `Story.tsx` (server): "Câu chuyện", nền kem ngà (D38); `content-visibility: auto` (D49).
- `hero.css`, `story.css`: bố cục. Hộp quà nằm ở `features/box-builder/components/box/`; cảnh mở nắp nay là một phần của builder (`useBoxArrival`, D47), không còn cảnh scroll-scrub.

Thay video/poster: xem `public/media/README.md`.
