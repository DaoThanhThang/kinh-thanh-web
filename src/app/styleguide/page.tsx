import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { Metadata } from 'next';
import { Button, Container, FoilDivider, Heading, Logo, Text } from '@/components/ui';
import { ChocolateImage } from '@/features/catalog/components/ChocolateImage';
import { getChocolates } from '@/lib/services/catalog';
import { formatVnd } from '@/lib/utils/formatVnd';
import { contrastRatio, parseColorTokens } from '@/styles/tokens/contrast';

export const metadata: Metadata = {
  title: 'Styleguide',
  robots: { index: false, follow: false },
};

const tokensCss = readFileSync(path.join(process.cwd(), 'src/styles/tokens/tokens.css'), 'utf8');
const hex = parseColorTokens(tokensCss);

type Swatch = { name: string; role: string; against: string };

const swatchGroups: { title: string; items: Swatch[] }[] = [
  {
    title: 'Cacao',
    items: [
      { name: 'cacao-950', role: 'nền sâu, thanh cuộn', against: 'cacao-900' },
      { name: 'cacao-900', role: 'nền chính', against: 'cacao-900' },
      { name: 'cacao-800', role: 'bề mặt', against: 'cacao-900' },
      { name: 'cacao-700', role: 'bề mặt nổi', against: 'cacao-900' },
      { name: 'cacao-600', role: 'đường kẻ mảnh', against: 'cacao-900' },
    ],
  },
  {
    title: 'Foil',
    items: [
      { name: 'foil-300', role: 'chữ nhấn khi hover', against: 'cacao-900' },
      { name: 'foil-400', role: 'vòng focus', against: 'cacao-900' },
      { name: 'foil-500', role: 'nhấn chính', against: 'cacao-900' },
      { name: 'foil-600', role: 'đường kẻ trên nền sáng', against: 'cacao-900' },
      { name: 'foil-700', role: 'nhấn trên nền kem', against: 'ivory-100' },
    ],
  },
  {
    title: 'Ivory',
    items: [
      { name: 'ivory-50', role: 'chữ chính trên nền tối', against: 'cacao-900' },
      { name: 'ivory-200', role: 'chữ nhấn nhẹ', against: 'cacao-900' },
      { name: 'ivory-400', role: 'chữ phụ, ngả ấm', against: 'cacao-900' },
      { name: 'ivory-100', role: 'nền section sáng', against: 'cacao-900' },
      { name: 'error-400', role: 'lỗi trên nền tối', against: 'cacao-900' },
    ],
  },
];

const typeRoles: {
  role: string;
  spec: string;
  sample: React.ReactNode;
}[] = [
  {
    role: 'display',
    spec: 'Noto Serif Display 400, hoa, tracking 0.16em, tối đa 6rem',
    sample: (
      <Heading as="h2" role="display">
        Kinh Thành
      </Heading>
    ),
  },
  {
    role: 'title',
    spec: 'Noto Serif Display 400, tracking 0.06em',
    sample: (
      <Heading as="h2" role="title">
        Trọn Vẹn Tinh Hoa, Vẹn Nguyên Giá Trị
      </Heading>
    ),
  },
  {
    role: 'heading',
    spec: 'Noto Serif Display 500, tracking 0.04em',
    sample: (
      <Heading as="h3" role="heading">
        Tự tay chọn từng viên cho người bạn thương
      </Heading>
    ),
  },
  {
    role: 'lead',
    spec: 'Noto Serif Display nghiêng 400',
    sample: <Text role="lead">Từ miền di sản, đến với thế giới</Text>,
  },
  {
    role: 'body',
    spec: 'Be Vietnam Pro 300, 1rem / 1.7, tối đa 65ch',
    sample: (
      <Text role="body">
        Chọn chocolate làm quà là chọn một cách để nói điều mình muốn nói. Có người thích vị đắng
        sâu của cacao, có người nhớ một viên nhân mềm ngọt dịu. Khi tự tay xếp từng viên vào hộp,
        bạn gửi đi sở thích của người nhận chứ không phải một lựa chọn chung. Hãy nghĩ đến người sẽ
        mở hộp, rồi chọn những viên bạn muốn họ nếm trước.
      </Text>
    ),
  },
  {
    role: 'small',
    spec: 'Be Vietnam Pro 400, 0.875rem',
    sample: (
      <Text role="small" tone="muted">
        Lời nhắn tối đa 150 ký tự. Bạn có thể sửa trước khi đặt hàng.
      </Text>
    ),
  },
  {
    role: 'label',
    spec: 'Be Vietnam Pro 500, hoa, tracking 0.18em (dùng cho nút)',
    sample: <span className="type-label text-accent">Tự tay chọn hộp quà</span>,
  },
  {
    role: 'tabular',
    spec: 'Số cùng bề rộng cho giá (VND)',
    sample: (
      <p className="type-heading text-text tabular">
        1.111.111 ₫<br />
        8.888.888 ₫
      </p>
    ),
  },
];

function SwatchRow({ s }: { s: Swatch }) {
  const value = hex[s.name] ?? '';
  const bg = hex[s.against] ?? '';
  const ratio = value && bg ? contrastRatio(value, bg) : 0;
  const same = s.name === s.against;
  return (
    <li className="flex items-center gap-5 py-3">
      <span
        aria-hidden="true"
        className="h-14 w-24 shrink-0 rounded-sm border border-line"
        style={{ backgroundColor: `var(--color-${s.name})` }}
      />
      <span className="flex min-w-0 flex-col">
        <span className="type-small text-text">
          {s.name} <span className="text-text-muted tabular">{value.toUpperCase()}</span>
        </span>
        <span className="type-small text-text-muted">
          {s.role}
          {same ? '' : ` · ${ratio.toFixed(2)}:1 trên ${s.against}`}
        </span>
      </span>
    </li>
  );
}

export default async function StyleguidePage() {
  const chocolates = await getChocolates();
  return (
    <main id="main">
      <Container className="pt-section">
        <div className="flex flex-col items-start gap-10 sm:flex-row sm:items-end sm:justify-between">
          <Logo size="md" />
          <Text role="small" tone="muted" className="sm:text-right">
            Trang nội bộ cho thiết kế. Không hiển thị cho khách.
          </Text>
        </div>
        <FoilDivider className="mt-16" />
      </Container>

      <Container as="section" className="pt-section">
        <Heading as="h2" role="title">
          Màu
        </Heading>
        <Text tone="muted" className="mt-4">
          Tương phản đo trực tiếp từ tokens.css. Chữ thường cần từ 4.5:1.
        </Text>
        <div className="mt-12 grid gap-x-16 gap-y-12 lg:grid-cols-3">
          {swatchGroups.map((g) => (
            <div key={g.title}>
              <Heading as="h3" role="heading">
                {g.title}
              </Heading>
              <ul className="mt-4 divide-y divide-line/60">
                {g.items.map((s) => (
                  <SwatchRow key={s.name} s={s} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Container>

      <Container as="section" className="pt-section">
        <Heading as="h2" role="title">
          Chữ
        </Heading>
        <dl className="mt-12 divide-y divide-line/60">
          {typeRoles.map((t) => (
            <div
              key={t.role}
              className="grid gap-4 py-10 first:pt-0 md:grid-cols-[14rem_1fr] md:gap-12"
            >
              <dt className="flex flex-col gap-1">
                <span className="type-small text-accent">{t.role}</span>
                <span className="type-small text-text-muted">{t.spec}</span>
              </dt>
              <dd className="min-w-0">{t.sample}</dd>
            </div>
          ))}
        </dl>
      </Container>

      <Container as="section" className="pt-section">
        <Heading as="h2" role="title">
          Nút
        </Heading>
        <div className="mt-12 grid gap-px bg-line/40 md:grid-cols-2">
          <div className="flex flex-col gap-8 bg-surface p-8 sm:p-12">
            <Heading as="h3" role="heading">
              Primary
            </Heading>
            <div className="flex flex-wrap items-center gap-x-8 gap-y-6">
              <Button>Mặc định</Button>
              <Button size="lg">Cỡ lớn</Button>
              <Button disabled>Vô hiệu</Button>
              <Button loading>Đang gửi</Button>
            </div>
            <Text role="small" tone="muted">
              Hover: nền foil nhẹ, nút bước lên 1px. Nhấn: hạ xuống. Tab để xem vòng focus.
            </Text>
          </div>
          <div className="flex flex-col gap-8 bg-surface p-8 sm:p-12">
            <Heading as="h3" role="heading">
              Ghost
            </Heading>
            <div className="flex flex-wrap items-center gap-x-8 gap-y-6">
              <Button variant="ghost" href="#styleguide">
                Xem chi tiết viên
              </Button>
              <Button variant="ghost" disabled>
                Vô hiệu
              </Button>
              <Button variant="ghost" loading>
                Đang tải
              </Button>
            </div>
            <Text role="small" tone="muted">
              Gạch chân vẽ ra từ trái sang phải khi hover.
            </Text>
          </div>
        </div>
        <div className="mt-8 max-w-md">
          <Text role="small" tone="error">
            Chưa gửi được lời nhắn. Kiểm tra kết nối rồi thử lại.
          </Text>
        </div>
      </Container>

      <Container as="section" className="pt-section">
        <Heading as="h2" role="title">
          Viên chocolate (ảnh tạm)
        </Heading>
        <Text tone="muted" className="mt-4">
          Mười hai viên đọc từ data/chocolates.json qua service, khay xếp theo hộp 12 viên (4 cột ×
          3 hàng). Giá và tên là dữ liệu tạm.
        </Text>
        <ul className="mt-12 grid grid-cols-3 gap-px bg-accent/40 p-px sm:grid-cols-4">
          {chocolates.map((c) => (
            <li
              key={c.id}
              className="flex flex-col items-center gap-3 bg-ground-deep px-2 pt-4 pb-5"
            >
              <ChocolateImage
                src={c.image}
                alt={c.name}
                width={400}
                height={400}
                className="h-auto w-full max-w-40"
              />
              <span className="type-small text-text">{c.name}</span>
              <span className="type-small text-text-muted tabular">{formatVnd(c.price)}</span>
            </li>
          ))}
        </ul>
        <figure className="mt-12 flex items-center gap-6">
          <ChocolateImage
            src="/chocolates/fallback.svg"
            alt="Ảnh thay thế khi thiếu file"
            width={400}
            height={400}
            className="h-auto w-28"
          />
          <figcaption className="type-small text-text-muted">
            Ảnh thay thế: hiện khi viên chưa có file ảnh hoặc ảnh tải lỗi.
          </figcaption>
        </figure>
      </Container>

      <Container as="section" className="py-section">
        <FoilDivider />
      </Container>

      <section className="theme-paper py-section">
        <Container>
          <div className="grid gap-12 md:grid-cols-[1fr_1.2fr] md:gap-20">
            <Heading as="h2" role="title">
              Lời nhắn đi cùng hộp quà
            </Heading>
            <div className="flex flex-col items-start gap-8">
              <Text role="lead">Vài dòng thật lòng là đủ.</Text>
              <Text>
                Mỗi hộp có thể kèm một tấm thiệp nhỏ. Hãy viết điều bạn muốn người nhận biết khi
                chọn từng viên, rồi để chocolate nói phần còn lại.
              </Text>
              <Text role="small" tone="muted">
                Nền kem ngà dùng xen kẽ. Chữ cacao-900, nhấn foil-700.
              </Text>
              <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
                <Button>Viết lời nhắn</Button>
                <Button variant="ghost" href="#styleguide">
                  Xem mẫu thiệp
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
