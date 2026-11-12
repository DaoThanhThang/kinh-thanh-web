import Link from 'next/link';
import { Container, FoilDivider, Logo, Text } from '@/components/ui';
import { siteConfig } from '@/config/site';
import { getStoreInfo, telHref } from '@/lib/services/store-info';
import { PlaceholderNotice } from './PlaceholderNotice';
import { site } from '@/content/site';
import './site.css';

/** Chân trang. Năm tính lúc build (trang tĩnh). */
export async function SiteFooter() {
  const { contact, placeholder } = await getStoreInfo();
  const tel = telHref(contact.phone);
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
              <li>
                <Link href={site.nav.contact.href} className="site-link">
                  {site.nav.contact.label}
                </Link>
              </li>
              <li>
                <Link href={site.nav.info.href} className="site-link">
                  {site.nav.info.label}
                </Link>
              </li>
            </ul>
          </nav>
        </div>
        <div className="site-footer-meta">
          <div className="site-footer-contact">
            <ul className="site-footer-details">
              {contact.phone ? (
                <li>
                  {tel ? (
                    <a href={tel} className="site-footer-a">
                      {contact.phone}
                    </a>
                  ) : (
                    contact.phone
                  )}
                </li>
              ) : null}
              {contact.email ? (
                <li>
                  <a href={`mailto:${contact.email}`} className="site-footer-a">
                    {contact.email}
                  </a>
                </li>
              ) : null}
              {contact.address ? <li>{contact.address}</li> : null}
              {contact.hours ? <li>{contact.hours}</li> : null}
            </ul>
            <PlaceholderNotice show={placeholder} />
          </div>
          <Text role="small" tone="muted">
            {site.footer.rights(year)}
          </Text>
        </div>
      </Container>
    </footer>
  );
}
