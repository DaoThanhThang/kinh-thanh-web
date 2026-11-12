import type { Metadata } from 'next';
import '@fontsource/noto-serif-display/400.css';
import '@fontsource/noto-serif-display/600.css';
import '@fontsource/noto-serif-display/400-italic.css';
import '@fontsource/be-vietnam-pro/300.css';
import '@fontsource/be-vietnam-pro/400.css';
import '@fontsource/be-vietnam-pro/500.css';
import { HashScroll } from '@/components/site/HashScroll';
import { SiteFooter } from '@/components/site/SiteFooter';
import { SiteHeader } from '@/components/site/SiteHeader';
import { SkipLink } from '@/components/site/SkipLink';
import { ChatWidget } from '@/features/chat/ChatWidget';
import { site } from '@/content/site';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: { default: site.brand, template: '%s — Kinh Thành' },
  description: site.description,
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    siteName: site.brand,
    title: site.brand,
    description: site.description,
  },
  twitter: { card: 'summary_large_image' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <SkipLink />
        <SiteHeader />
        <HashScroll />
        {children}
        <SiteFooter />
        <ChatWidget />
      </body>
    </html>
  );
}
