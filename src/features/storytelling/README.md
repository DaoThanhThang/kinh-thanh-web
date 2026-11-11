Tính năng kể chuyện thương hiệu (hero, hộp quà, hoạt ảnh cuộn).

## Thành phần

- `Hero.tsx` (server): hộp đóng + dòng dẫn + nút tới `#builder`. Chứa h1 duy nhất (logo trên nắp).
- `OpenScene.tsx` (client): cảnh nắp mở; mặc định hộp mở sẵn.
- `SceneMotion.tsx` (client, tải động): GSAP ScrollTrigger tween biến CSS `--open` (xem D22, D23).
- `story.css`: bố cục hero/cảnh. Hộp quà nằm ở `features/box-builder/components/box/`.
