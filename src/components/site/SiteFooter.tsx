import { Container, FoilDivider, Logo, Text } from '@/components/ui';
import { siteConfig } from '@/config/site';
import { getStoreInfo, telHref } from '@/lib/services/store-info';
import { PlaceholderNotice } from './PlaceholderNotice';
import { site } from '@/content/site';
import './site.css';

/**
 * Chân trang: mọi thứ nằm trên MỘT trục giữa trang (R2, D65): vạch foil, logo xếp dọc, slogan,
 * khối liên hệ, bản quyền. Không có cột liên kết. Năm tính lúc build (trang tĩnh).
 */
export async function SiteFooter() {
  const { contact, placeholder } = await getStoreInfo();
  const tel = telHref(contact.phone);
  const year = new Date().getFullYear();
  const reach = [
    contact.phone ? (
      <li key="phone">
        {tel ? (
          <a href={tel} className="site-footer-a">
            {contact.phone}
          </a>
        ) : (
          contact.phone
        )}
      </li>
    ) : null,
    contact.email ? (
      <li key="email">
        <a href={`mailto:${contact.email}`} className="site-footer-a">
          {contact.email}
        </a>
      </li>
    ) : null,
  ].filter(Boolean);
  return (
    <footer className="site-footer">
      <Container className="site-footer-inner">
        <FoilDivider className="site-footer-rule" />
        <div className="site-footer-brand">
          <Logo size="md" />
          <Text role="lead" tone="muted" className="site-footer-slogan">
            {siteConfig.tagline}
          </Text>
        </div>
        <div className="site-footer-contact">
          {reach.length > 0 ? <ul className="site-footer-reach">{reach}</ul> : null}
          {contact.address ? <p className="site-footer-line">{contact.address}</p> : null}
          {contact.hours ? <p className="site-footer-line">{contact.hours}</p> : null}
          <PlaceholderNotice show={placeholder} className="site-footer-notice" />
        </div>
        <Text role="small" tone="muted" className="site-footer-rights">
          {site.footer.rights(year)}
        </Text>
      </Container>
    </footer>
  );
}
