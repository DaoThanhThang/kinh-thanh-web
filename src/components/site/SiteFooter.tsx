import Link from 'next/link';
import { Container, FoilDivider, Logo, Text } from '@/components/ui';
import { siteConfig } from '@/config/site';
import { site } from '@/content/site';
import './site.css';

/** Chân trang. Năm tính lúc build (trang tĩnh). */
export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <Container className="site-footer-inner">
        <FoilDivider />
        <div className="site-footer-grid">
          <div className="site-footer-brand">
            <Logo size="md" />
            <Text role="lead" tone="muted" className="max-w-[26ch]">
              {siteConfig.tagline}
            </Text>
          </div>
          <nav aria-label={site.footer.navLabel}>
            <ul className="site-footer-links">
              <li>
                <Link href={site.nav.story.href} className="site-link">
                  {site.nav.story.label}
                </Link>
              </li>
              <li>
                <Link href={site.nav.builder.href} className="site-link">
                  {site.nav.builder.label}
                </Link>
              </li>
              <li>
                <Link href={site.nav.order.href} className="site-link">
                  {site.nav.order.label}
                </Link>
              </li>
            </ul>
          </nav>
        </div>
        <div className="site-footer-meta">
          <Text role="small" tone="muted">
            {site.footer.contact}
          </Text>
          <Text role="small" tone="muted">
            {site.footer.rights(year)}
          </Text>
        </div>
      </Container>
    </footer>
  );
}
