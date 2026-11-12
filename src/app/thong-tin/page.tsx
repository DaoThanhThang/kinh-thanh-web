import type { Metadata } from 'next';
import Link from 'next/link';
import { PlaceholderNotice } from '@/components/site/PlaceholderNotice';
import { Container, FoilDivider, Heading, Text } from '@/components/ui';
import { info } from '@/content/info';
import { getStoreInfo } from '@/lib/services/store-info';
import '@/features/info/info.css';

const t = info.page;

export const metadata: Metadata = {
  title: t.pageTitle,
  description: t.intro,
  alternates: { canonical: '/thong-tin' },
};

export default async function InfoPage() {
  const { shipping, returns, storage, faq, placeholder } = await getStoreInfo();
  const shippingRows = [
    { label: t.shippingAreas, value: shipping.areas.join('; ') },
    { label: t.shippingLead, value: shipping.leadTime },
    { label: t.shippingFee, value: shipping.fee },
    { label: t.shippingPack, value: shipping.packaging },
  ].filter((r) => r.value);

  return (
    <main id="main" className="pg">
      <Container className="pg-inner">
        <header className="pg-head">
          <Heading as="h1" role="title">
            {t.heading}
          </Heading>
          <Text tone="muted">{t.intro}</Text>
          <PlaceholderNotice show={placeholder} />
          <FoilDivider className="max-w-xs" />
        </header>

        {faq.length > 0 ? (
          <section id="hoi-dap" className="pg-section" aria-labelledby="hoi-dap-h">
            <Heading as="h2" role="heading" id="hoi-dap-h">
              {t.faqHeading}
            </Heading>
            <div className="faq">
              {faq.map((item) => (
                <details key={item.question}>
                  <summary>{item.question}</summary>
                  <p className="faq-answer">{item.answer}</p>
                </details>
              ))}
            </div>
            <Link href="/lien-he" className="pg-link">
              {t.contactCta}
            </Link>
          </section>
        ) : null}

        <section id="giao-hang" className="pg-section" aria-labelledby="giao-hang-h">
          <Heading as="h2" role="heading" id="giao-hang-h">
            {t.shippingHeading}
          </Heading>
          {shippingRows.length > 0 ? (
            <dl className="pg-facts">
              {shippingRows.map((r) => (
                <div key={r.label} className="pg-fact">
                  <dt>{r.label}</dt>
                  <dd>{r.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          {returns.policy ? (
            <>
              <Heading as="h3" role="heading" className="pg-sub">
                {t.returnsHeading}
              </Heading>
              <Text>{returns.policy}</Text>
            </>
          ) : null}
        </section>

        {storage.tips.length > 0 ? (
          <section id="bao-quan" className="pg-section" aria-labelledby="bao-quan-h">
            <Heading as="h2" role="heading" id="bao-quan-h">
              {t.storageHeading}
            </Heading>
            <ul className="pg-list">
              {storage.tips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </section>
        ) : null}
      </Container>
    </main>
  );
}
