# Kinh Thành Chocolate – website

**English summary.** A Vietnamese-language storefront for a premium chocolate brand. Visitors pick a box size (6/9/12/16), place individual pieces into a 3D CSS gift box (drag and drop on desktop, tap-to-place on mobile), add a card message and submit an order. Frontend only: orders go to a mock service by default and can be pointed at a Google Apps Script endpoint. Built with Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, Zustand, Zod, dnd-kit and Vitest. Quick start: `npm ci && npm run dev`, then open http://localhost:3000.

## Giới thiệu

Website chocolate cao cấp mang di sản Việt (trống đồng Đông Sơn, chim Lạc, cổng thành). Khách chọn cỡ hộp, xếp từng viên vào ô, thêm lời nhắn rồi đặt hàng. Giai đoạn hiện tại chỉ có frontend.

## Ảnh chụp

| Trang chủ (1440)                             | Mở nắp hộp (1440)                                 |
| -------------------------------------------- | ------------------------------------------------- |
| ![Trang chủ](docs/screenshots/hero-1440.jpg) | ![Mở nắp hộp](docs/screenshots/open-box-1440.jpg) |

| Xếp hộp (390)                                                | Đặt hàng (390)                                                 |
| ------------------------------------------------------------ | -------------------------------------------------------------- |
| ![Xếp hộp trên điện thoại](docs/screenshots/builder-390.jpg) | ![Đặt hàng trên điện thoại](docs/screenshots/checkout-390.jpg) |

## Yêu cầu

- Node.js từ 20.9 trở lên, khuyến nghị 22 (xem `.nvmrc`)
- npm (đi kèm Node)

## Bắt đầu nhanh

```bash
npm ci
npm run dev
```

Mở http://localhost:3000. Biến môi trường là tuỳ chọn: sao chép `.env.example` thành `.env.local` nếu cần.

## Các lệnh

- `npm run dev` – chạy môi trường phát triển
- `npm run build` / `npm run start` – build và chạy bản production
- `npm run lint` – ESLint
- `npm run format` / `npm run format:check` – Prettier
- `npm run typecheck` – kiểm tra kiểu TypeScript
- `npm test` – Vitest (`npm run test:watch` để theo dõi)
- `npm run check` – chạy lần lượt typecheck, lint, format:check, test, build (giống CI)

## Cấu trúc thư mục

```
src/app                  Route, layout, metadata (icon, opengraph-image, robots, sitemap, 404)
src/features/            storytelling, box-builder, catalog, checkout
src/components/ui        Thành phần giao diện dùng chung
src/components/site      Thanh đầu trang, chân trang, skip-link
src/lib/                 services, schemas, utils
src/styles/tokens        Design tokens (màu, chữ, khoảng cách, chuyển động)
src/config               Cấu hình site (tên, tagline)
src/content              Nội dung chữ tiếng Việt
data/                    Dữ liệu JSON (chocolates, boxes)
public/chocolates        Ảnh chocolate (tạm)
public/media             Video + ảnh nền hero (tạm, xem public/media/README.md)
docs/                    Tài liệu dự án
```

## Thay dữ liệu và ảnh chocolate

Tên, giá, mô tả, ảnh của từng viên nằm trong `data/chocolates.json`, giá hộp theo cỡ trong `data/boxes.json`; ảnh đặt ở `public/chocolates/`. Không cần sửa code. Xem hướng dẫn ở [data/README.md](data/README.md).

## Thay video / ảnh nền hero

Video nền ở `public/media/hero.mp4`, ảnh hiện ngay và dùng khi giảm chuyển động ở `public/media/hero-poster.jpg`. Hai tệp hiện tại chỉ là bản tạm. Thay bằng tệp thật giữ NGUYÊN TÊN là xong, không cần sửa code. Khuyến nghị: 1920×1080, H.264 MP4 + AAC, ≤ 8–10 MB, lặp liền 10–20 giây, chủ thể nằm ở 55% bên phải khung hình (bên trái là chữ). Nếu video không có tiếng, đặt `heroVideoHasAudio: false` trong `src/config/media.ts`. Chi tiết (cả bản mobile tuỳ chọn): [public/media/README.md](public/media/README.md).

## Đặt hàng hoạt động thế nào

- Mặc định (`NEXT_PUBLIC_ORDER_ENDPOINT` để trống): form gửi tới `POST /api/order` của chính site. Máy chủ kiểm lại đơn, tính lại giá từ danh mục, dựng ảnh khay rồi gửi email cho cửa hàng (xem mục "Nhận đơn qua email").
- `NEXT_PUBLIC_ORDER_ENDPOINT=mock`: chỉ ghi đơn ra console (demo, không cần server).
- `NEXT_PUBLIC_ORDER_ENDPOINT=<URL Google Apps Script>`: phương án thay thế, đơn được POST tới đó (`text/plain`, JSON), không có email/ảnh khay.

Dạng dữ liệu đơn và mẫu `doPost` xem [docs/ORDER-PAYLOAD.md](docs/ORDER-PAYLOAD.md).

## Nhận đơn qua email

Khi khách bấm "Gửi đơn hàng", cửa hàng nhận một email (tiêu đề dạng `Đơn mới KT-… · Hộp 12 viên · 760.000 ₫ · Tên khách`) có ảnh khay khách đã xếp (nhúng trong thư và đính kèm `KT-…-khay.png` để in), danh sách từng ô, giá, thiệp, thông tin khách và checklist chuẩn bị. Khách có email thì nhận thêm thư xác nhận.

Cấu hình bằng Gmail (Mật khẩu ứng dụng):

1. Vào tài khoản Google dùng để gửi thư, bật **Xác minh 2 bước**.
2. Vào https://myaccount.google.com/apppasswords, tạo **Mật khẩu ứng dụng** (đặt tên bất kỳ), sao chép chuỗi 16 ký tự.
3. Trên Vercel: Project → Settings → **Environment Variables**, thêm `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`, `SMTP_SECURE=true`, `SMTP_USER=<gmail gửi thư>`, `SMTP_PASS=<mật khẩu ứng dụng>`, `MAIL_FROM=<gmail gửi thư>`, `SHOP_ORDER_EMAIL=<email nhận đơn>` (mặc định `abc@gmail.com`, đổi bất cứ lúc nào).
4. **Redeploy** để biến có hiệu lực. Gửi thử một đơn để kiểm tra.

Chạy local không cấu hình SMTP: chế độ xem trước, không gửi thư; email (HTML) và ảnh khay được ghi vào thư mục `kinh-thanh-mail` trong thư mục tạm của hệ điều hành (đường dẫn in ra ở terminal). Trên Vercel mà thiếu SMTP, đơn bị từ chối (khách thấy báo lỗi) để không mất đơn trong im lặng. Giới hạn chống lạm dụng: 5 đơn / 10 phút / IP (bộ nhớ từng instance, nâng cấp bằng Vercel KV/Upstash nếu cần).

## Chatbot tư vấn

Nút "Tư vấn quà" ở góc phải dưới mọi trang mở một khung chat: khách hỏi về hộp quà, khẩu vị, ngân sách, giao hàng; trợ lý (Claude Haiku 5.5) trả lời bằng tiếng Việt dựa trên đúng dữ liệu của site (`data/chocolates.json`, `data/boxes.json`, `data/store-info.json`, phần Câu chuyện) và có thể đề xuất một hộp cụ thể kèm nút "Xếp hộp này cho tôi" (xếp thẳng vào builder). Khoá API chỉ nằm ở server (`/api/chat`), không bao giờ gửi xuống trình duyệt.

Đặt khoá trên Vercel:

1. Tạo khoá tại https://platform.claude.com (Claude Console → API keys).
2. Vercel: Project → Settings → **Environment Variables**, thêm `ANTHROPIC_API_KEY=<khoá>` (Production; không đặt tiền tố `NEXT_PUBLIC_`). Tuỳ chọn: `CHAT_MODEL` (mặc định `claude-haiku-5-5`), `CHAT_ENABLED`.
3. **Redeploy** để biến có hiệu lực.

Không có khoá: chạy local thì khung chat ở **chế độ thử** (trả lời mẫu, không gọi mạng, ghi chú nhỏ trong khung) để dựng giao diện; trên Vercel thì nút chat tự ẩn và `/api/chat` trả 503.

Kiểm soát chi phí:

- **Ước tính** (chưa đo thực tế, phụ thuộc độ dài hội thoại): giá Haiku 5.5 là $0,10 / $0,50 mỗi triệu token vào / ra, đọc cache $0,01. Prompt hệ thống (catalog + thông tin cửa hàng, vài nghìn token) được cache nên mỗi lượt hỏi chỉ tốn vài phần nghìn đô-la; một cuộc trò chuyện vài lượt khoảng $0,002, tức ~**$2 cho 1.000 cuộc trò chuyện**. Số token thật của từng yêu cầu được ghi ở log server (`[api/chat] model=… input=… cache_read=… output=…`), xem ở Vercel → Logs để đối chiếu.
- **Spend limit**: vào Claude Console → Settings → Limits (hoặc Billing) và đặt hạn mức chi tiêu hàng tháng cho workspace/khoá này. Đây là chốt chặn cuối cùng, đặt trước khi mở cho khách.
- **Công tắc tắt khẩn cấp**: đặt `CHAT_ENABLED=false` trên Vercel rồi Redeploy; nút chat biến mất và `/api/chat` trả 503. Muốn bật lại thì xoá biến (hoặc đặt `true`) và Redeploy. Cũng có thể xoá `ANTHROPIC_API_KEY` ở Console để vô hiệu khoá ngay.
- Giới hạn có sẵn: 20 tin / 10 phút và 60 tin / ngày / IP, tin ≤ 600 ký tự, ≤ 16 tin mỗi yêu cầu, đầu ra ≤ 600 token, chỉ nhận yêu cầu cùng nguồn gốc. Bộ đếm nằm trong bộ nhớ từng instance serverless (chỉ răn đe, không tuyệt đối); nâng cấp bằng Vercel KV/Upstash cùng interface `check` (`src/lib/order-server/rate-limit.ts`).

Chữ trong khung chat ở `src/content/chat.ts`; prompt hệ thống ở `src/lib/chat/system-prompt.ts` (tự cập nhật theo dữ liệu JSON, không cần sửa khi thêm viên). Khi thông tin cửa hàng còn `placeholder: true`, trợ lý luôn nhắc khách xác nhận lại với cửa hàng.

## Triển khai lên Vercel

1. Đẩy mã lên GitHub (xem bên dưới).
2. Trên Vercel chọn **Add New… → Project**, import repo `kinh-thanh-web`. Framework được nhận tự động là Next.js.
3. Ở **Environment Variables** đặt `NEXT_PUBLIC_SITE_URL` (địa chỉ công khai, ví dụ `https://ten-mien.vn`) và, khi đã có, `NEXT_PUBLIC_ORDER_ENDPOINT`.
4. Deploy.

## Tài liệu

- [docs/CONTEXT.md](docs/CONTEXT.md) – mục tiêu và luật nghiệp vụ
- [docs/DECISIONS.md](docs/DECISIONS.md) – các quyết định kỹ thuật và thiết kế
- [docs/BRAND.md](docs/BRAND.md) – nhận diện thương hiệu
- [docs/DESIGN-RULES.md](docs/DESIGN-RULES.md) – quy tắc thiết kế
- [docs/TASKS.md](docs/TASKS.md) – tiến độ
- [PRODUCT.md](PRODUCT.md) – sự thật về sản phẩm
- [DESIGN.md](DESIGN.md) – hệ thống thiết kế

## Đẩy lên GitHub

Tạo một repo trống `kinh-thanh-web` trên GitHub, rồi trong thư mục dự án:

```bash
git init
git add .
git commit -m "Kinh Thành Chocolate website – frontend MVP"
git branch -M main
git remote add origin https://github.com/<user>/kinh-thanh-web.git
git push -u origin main
```

CI (`.github/workflows/ci.yml`) sẽ chạy typecheck, lint, format, test và build trên mỗi lần push hoặc pull request vào `main`.
