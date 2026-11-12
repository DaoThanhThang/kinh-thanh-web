import type { Metadata } from 'next';
import { PlaceholderNotice } from '@/components/site/PlaceholderNotice';
import { Container, FoilDivider, Heading, Text } from '@/components/ui';
import { info } from '@/content/info';
import { ContactForm } from '@/features/info/ContactForm';
import { getStoreInfo, telHref, zaloUrl } from '@/lib/services/store-info';
import '@/features/info/info.css';

const t = info.contact;

export const metadata: Metadata = {
  title: t.pageTitle,
  description: t.intro,
  alternates: { canonical: '/lien-he' },
};

export default async function ContactPage() {
  const { contact, placeholder } = await getStoreInfo();
  const tel = telHref(contact.phone);
  const zalo = zaloUrl(contact.zalo);
  const rows: { label: string; value: React.ReactNode }[] = [];
  if (contact.phone)
    rows.push({
      label: t.phone,
      value: tel ? (
        <a className="pg-link" href={tel}>
          {contact.phone}
        </a>
      ) : (
        contact.phone
      ),
    });
  if (contact.email)
    rows.push({
      label: t.email,
      value: (
        <a className="pg-link" href={`mailto:${contact.email}`}>
          {contact.email}
        </a>
      ),
    });
  if (zalo)
    rows.push({
      label: t.zalo,
      value: (
        <a className="pg-link" href={zalo} target="_blank" rel="noopener noreferrer">
          {t.zaloLink(contact.zalo)}
        </a>
      ),
    });
  if (contact.facebook)
    rows.push({
      label: t.facebook,
      value: (
        <a className="pg-link" href={contact.facebook} target="_blank" rel="noopener noreferrer">
          {t.facebookLink}
        </a>
      ),
    });
  if (contact.address) rows.push({ label: t.address, value: contact.address });
  if (contact.hours) rows.push({ label: t.hours, value: contact.hours });

  return (
    <main id="main" className="pg">
      <Container className="pg-inner">
        <header className="pg-head">
          <Heading as="h1" role="title">
            {t.heading}
          </Heading>
          <Text tone="muted">{t.intro}</Text>
          <FoilDivider className="max-w-xs" />
        </header>
        <div className="pg-contact">
          <section className="pg-section" aria-labelledby="ct-details-h">
            <Heading as="h2" role="heading" id="ct-details-h">
              {t.detailsHeading}
            </Heading>
            <dl className="pg-facts">
              {rows.map((r) => (
                <div key={r.label} className="pg-fact">
                  <dt>{r.label}</dt>
                  <dd>{r.value}</dd>
                </div>
              ))}
            </dl>
            <PlaceholderNotice show={placeholder} />
          </section>
          <ContactForm />
        </div>
      </Container>
    </main>
  );
}
