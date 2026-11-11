---
name: Kinh Thành Chocolate
description: Nền bìa nâu cacao rất đậm, nét foil vàng champagne mảnh, chữ kem ngà. Trang trọng, kiềm chế, như tấm ép nhũ trên bao bì.
colors:
  cacao-950: '#1A100B'
  cacao-900: '#24160F'
  cacao-800: '#2F1E15'
  cacao-700: '#3E2A1E'
  cacao-600: '#5A3E2C'
  foil-300: '#E6CC92'
  foil-400: '#D4B06A'
  foil-500: '#C9A45C'
  foil-600: '#A8843F'
  foil-700: '#7A5E2A'
  ivory-50: '#F6EFE2'
  ivory-100: '#F3EBDC'
  ivory-200: '#E3D6BF'
  ivory-400: '#BFAE93'
  error-400: '#E39A7B'
typography:
  display:
    fontFamily: "'Noto Serif Display', Georgia, serif"
    fontSize: 'clamp(2.25rem, 1.2rem + 4.6vw, 6rem)'
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: 0.16em
  title:
    fontFamily: "'Noto Serif Display', Georgia, serif"
    fontSize: 'clamp(1.75rem, 1.2rem + 2.2vw, 3rem)'
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: 0.06em
  heading:
    fontFamily: "'Noto Serif Display', Georgia, serif"
    fontSize: 'clamp(1.25rem, 1.05rem + 0.9vw, 1.75rem)'
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: 0.04em
  lead:
    fontFamily: "'Noto Serif Display', Georgia, serif"
    fontSize: 'clamp(1.125rem, 1rem + 0.5vw, 1.5rem)'
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: 0.01em
  body:
    fontFamily: "'Be Vietnam Pro', system-ui, sans-serif"
    fontSize: 1rem
    fontWeight: 300
    lineHeight: 1.7
    letterSpacing: 0.015em
  small:
    fontFamily: "'Be Vietnam Pro', system-ui, sans-serif"
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: 0.02em
  label:
    fontFamily: "'Be Vietnam Pro', system-ui, sans-serif"
    fontSize: 0.8125rem
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: 0.18em
rounded:
  none: 0
  sm: 2px
  md: 4px
spacing:
  unit: 4px
  section: 'clamp(4rem, 2.5rem + 7vw, 9rem)'
  gutter: 'clamp(1rem, 0.5rem + 2vw, 2.5rem)'
components:
  button-primary:
    backgroundColor: transparent
    textColor: '{colors.foil-500}'
    typography: '{typography.label}'
    rounded: '{rounded.sm}'
    padding: 0 28px
    height: 48px
  button-primary-hover:
    backgroundColor: '{colors.foil-500}'
    textColor: '{colors.foil-300}'
  button-ghost:
    backgroundColor: transparent
    textColor: '{colors.foil-500}'
    typography: '{typography.label}'
    rounded: '{rounded.none}'
---

# Kinh Thành Chocolate

## Overview

Trang web là chiếc hộp quà Kinh Thành: nền bìa nâu cacao có thớ giấy rất nhẹ, nét khắc foil vàng mảnh (cổng thành, ngôi sao trống đồng), chữ kem ngà. Thành phần như được ép nhũ: nút là khung foil hai nét, vạch phân cách là đường foil với ngôi sao nhỏ ở giữa. Nền tối là chủ đạo (khách thường xem buổi tối; bao bì tối); kem ngà chỉ dùng cho section sáng xen kẽ. Sang trọng là sự kiềm chế: ít yếu tố, chuyển động chậm.

## Colors

Nguồn: `src/styles/tokens/tokens.css`. Màu nguyên thủy (cacao, foil, ivory) và màu theo vai trò (`ground`, `surface`, `surface-raised`, `line`, `text`, `text-muted`, `accent`, `focus`, `error`, `paper`, `ink`).

- Nền: cacao-900 (chính), cacao-950 (sâu), cacao-800 (bề mặt), cacao-700 (nổi), cacao-600 (đường kẻ mảnh).
- Nhấn: foil-500 chính; foil-300 khi hover; foil-400 vòng focus; foil-600/700 trên nền sáng.
- Chữ trên nền tối: ivory-50 (chính), ivory-400 (phụ, ngả ấm, không xám trung tính).
- Section sáng (`.theme-paper`): nền ivory-100, chữ cacao-900, nhấn foil-700; các token vai trò được đổi nghĩa nên utility tự đúng.
- Tương phản được kiểm bằng test (`contrast.test.ts`): mọi chữ >= 4.5:1. Giá trị khởi đầu đều đạt, không phải chỉnh.
- Không có màu tím; không gradient chữ.

## Typography

Hai họ, tự host qua `@fontsource`: Noto Serif Display (400, 500, 400 nghiêng) cho tiêu đề; Be Vietnam Pro (300, 400, 500) cho nội dung.

- display: hoa, tracking 0.16em, tối đa 6rem, `text-wrap: balance`.
- title, heading: serif, tracking nhẹ, cân bằng dòng.
- lead: serif nghiêng cho tagline/câu dẫn.
- body: 1rem/1.7, weight 300, tracking 0.015em (bù cho chữ sáng trên nền tối), tối đa 65ch.
- small: 0.875rem. label: hoa, 500, tracking 0.18em, chỉ dùng cho nút, không làm eyebrow.
- `tabular`: số cùng bề rộng cho giá.
- Fallback: Georgia / Times New Roman; system-ui.

## Layout

Nền khoảng cách 4px (Tailwind `--spacing: 0.25rem`). `py-section` = clamp(4rem..9rem). `Container`: tối đa 76rem, lề `gutter` (tối thiểu 16px). Nhóm chặt, phân tách rộng; khoảng trên tiêu đề lớn hơn dưới. Không dùng lưới thẻ đều làm khung trang.

## Elevation & Depth

Hai bóng, đều ấm (cacao-950 pha alpha), có offset và blur mềm: `shadow-raised` (bề mặt nổi) và `shadow-box` (dành cho hộp quà). Không bóng cứng, không glass, không blur trang trí. Độ sâu chủ yếu đến từ bậc nền cacao-900 → 800 → 700 và đường kẻ foil mảnh.

## Shapes

Khung foil gần vuông: bo 0, 2px, 4px; không pill. Họa tiết là nét mảnh (stroke) vẽ tay bằng SVG: cổng thành ba tầng mái, ngôi sao 14 cánh kiểu trống đồng. Không icon bằng emoji/ký tự.

## Components

`src/components/ui/` (xem `/styleguide`):

- Button primary: khung foil 1px cộng một nét inset mảnh; hover nền foil 15% và bước lên 1px; active hạ xuống; disabled; loading (spinner SVG, `aria-busy`). Button ghost: chữ foil, gạch chân vẽ ra từ trái sang phải khi hover. Có `href` thì render như liên kết.
- Heading (h1–h4 với role display/title/heading), Text (lead/body/small, tone default/muted/error), Container, FoilDivider, Logo (cổng thành + "KINH THÀNH" / "CHOCOLATE").
- Bề mặt trình duyệt: `::selection` foil, caret foil, thanh cuộn mảnh cacao-700, focus ring 2px foil-400 offset 3px, `underline-offset`, `color-scheme: dark`.
- Chuyển động: ease-out-expo `cubic-bezier(0.16,1,0.3,1)`, in-out-soft `cubic-bezier(0.65,0,0.35,1)`; 160/320/700/1400ms. `prefers-reduced-motion` đưa chuyển tiếp CSS về gần tức thì.

## Do's and Don'ts

Do

- Dùng token, không hex trực tiếp trong component.
- Để foil làm điểm nhấn hiếm và mảnh; để chữ kem ngà gánh nội dung.
- Một khoảnh khắc chuyển động chính (mở nắp hộp), nội dung hiện sẵn trước khi animate.

Don't

- Không eyebrow trên tiêu đề, không đánh số section, không gradient chữ, không glass.
- Không viền màu trái/phải dày hơn 1px, không bóng cứng không blur.
- Không bịa số liệu, lời chứng thực, năm thành lập.
- Không dùng xám trung tính cho chữ phụ.
