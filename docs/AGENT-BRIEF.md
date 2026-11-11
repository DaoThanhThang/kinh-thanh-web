# Brief cho agent code (đọc trước mỗi task)

Dự án: /home/claude/kinh-thanh-web — Next.js 16 App Router, React 19, Tailwind v4, TS strict (+noUncheckedIndexedAccess), Zustand 5, Zod 4, GSAP 3.15 + @gsap/react, dnd-kit, Vitest, npm. Đọc AGENTS.md: phiên bản Next có thể khác kiến thức của bạn → tra `node_modules/next/dist/docs/` khi không chắc.

ĐỌC TRƯỚC: docs/CONTEXT.md, docs/DECISIONS.md, docs/BRAND.md, docs/DESIGN-RULES.md, docs/surface-briefs/home.md (chỉ cho phát triển — KHÔNG chép chữ trong đó vào code/comment/metadata), PRODUCT.md, DESIGN.md, .claude/skills/impeccable/reference/craft-floor.md (+ animate.md khi làm chuyển động). Nhìn docs/reference/client-packaging-demo.jpg (chuẩn hình ảnh).

LUẬT CHUNG
- Dùng tokens (src/styles/tokens) và component sẵn có (src/components/ui). Không hardcode hex trong component/page (file SVG trong /public được miễn; màu trong SVG inline component dùng `currentColor` hoặc CSS var).
- Text hiển thị cho khách đặt trong src/content/ (tiếng Việt). Không bịa số liệu, lời chứng thực, năm, địa chỉ.
- Không eyebrow/kicker, không đánh số section, không gradient text, không glass, không emoji icon, không fade-in mọi section, không scroll-jacking.
- Mobile-first; D18 (hộp giữ lưới thật, ô ≥ 64px, vùng chạm ≥ 44px). Không tràn ngang ở 360px.
- Accessibility: semantic HTML, focus thấy rõ, bàn phím, aria-live khi trạng thái hộp đổi, prefers-reduced-motion.
- Hiệu năng: lazy-load GSAP/dnd-kit trong client component khi có thể; không CLS.
- Không cài thêm thư viện ngoài danh sách nếu không thật cần; nếu cài, pin version và ghi DECISIONS.
- Quyết định mới → thêm D-số tiếp theo vào docs/DECISIONS.md. Cập nhật docs/TASKS.md (task xong → ⏳).

KIỂM TRA BẮT BUỘC trước khi báo xong: `npm run typecheck`, `lint`, `format:check`, `test`, `build` đều pass. Sau đó `npm run build && npm run start` (cổng 3000, chạy nền), dùng Playwright có sẵn (`require('playwright')`, `chromium.launch()` không tham số; KHÔNG chạy `playwright install`) chụp ảnh vào `.review/` với tên `tXX-*.png` ở 1440×900 và 390×844 (deviceScaleFactor 1), kèm ảnh các trạng thái tương tác quan trọng. Tự xem ảnh, sửa lỗi hiển thị trước khi báo xong. Tắt server.

BÁO CÁO cuối (ngắn): file tạo/sửa, quyết định đã đưa ra, kết quả kiểm tra, đường dẫn ảnh, vấn đề còn lại. Không dán nội dung file.
