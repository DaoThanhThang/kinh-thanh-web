import type { Metadata } from 'next';
import { PlaceholderNotice } from '@/components/site/PlaceholderNotice';
import { Button, Container, FoilDivider, Heading, Text } from '@/components/ui';
import { GiftBox, Ribbon } from '@/features/box-builder/components/box';
import { LacBird } from '@/features/box-builder/components/box/art/LacBird';
import { info } from '@/content/info';
import { ChatAskButton } from '@/features/info/ChatAskButton';
import { FaqAccordion } from '@/features/info/FaqAccordion';
import { InfoNav } from '@/features/info/InfoNav';
import { Gauge, ReturnMark, StepMark, gaugeScale } from '@/features/info/art';
import { groupFaq } from '@/features/info/faq-groups';
import { getStoreInfo } from '@/lib/services/store-info';
import '@/features/info/info.css';

const t = info.page;

export const metadata: Metadata = {
  title: t.pageTitle,
  description: t.intro,
  alternates: { canonical: '/thong-tin' },
};

function BulletList({ items, className }: { items: readonly string[]; className?: string }) {
  return (
    <ul className={['pg-list', className].filter(Boolean).join(' ')}>
      {items.map((it) => (
        <li key={it}>{it}</li>
      ))}
    </ul>
  );
}

export default async function InfoPage() {
  const { shipping, returns, storage, faq, placeholder } = await getStoreInfo();

  const hasShipping =
    shipping.steps.length > 0 ||
    shipping.zones.length > 0 ||
    !!(shipping.leadTime || shipping.fee || shipping.packaging || shipping.areas.length);
  const hasReturns =
    !!returns.policy ||
    returns.eligible.length + returns.howTo.length + returns.exclusions.length > 0;
  const hasStorage = storage.tips.length > 0 || storage.do.length + storage.avoid.length > 0;
  const visible: Record<string, boolean> = {
    'hoi-dap': faq.length > 0,
    'giao-hang': hasShipping,
    'doi-tra': hasReturns,
    'bao-quan': hasStorage,
  };
  const navItems = t.nav.filter((n) => visible[n.id]);

  const { range } = storage;
  const rangeText = `${range.min}–${range.max}°C`;
  const gauge = gaugeScale(range.min, range.max);
  const bandCenterPct = ((gauge.bandTop + gauge.bandBottom) / 2 / 360) * 100;

  const legacyRows = [
    { label: 'Khu vực giao', value: shipping.areas.join('; ') },
    { label: 'Thời gian giao', value: shipping.leadTime },
  ].filter((r) => r.value);

  return (
    <main id="main" className="pg">
      <Container className="pg-inner">
        <div className="ip-frame">
          <header className="pg-head ip-head">
            <Heading as="h1" role="title">
              {t.heading}
            </Heading>
            <Text tone="muted">{t.intro}</Text>
            <PlaceholderNotice show={placeholder} />
            <FoilDivider className="max-w-xs" />
          </header>

          <div className="ip-body">
            <InfoNav items={navItems} label={t.navLabel} />

            <div className="ip-content">
              {visible['hoi-dap'] ? (
                <section id="hoi-dap" className="ip-section" aria-labelledby="hoi-dap-h">
                  <div className="ip-title-row">
                    <Heading as="h2" role="heading" id="hoi-dap-h">
                      {t.faqHeading}
                    </Heading>
                    <LacBird className="ip-bird" />
                  </div>
                  <FaqAccordion groups={groupFaq(faq)} />
                </section>
              ) : null}

              {visible['giao-hang'] ? (
                <section id="giao-hang" className="ip-section" aria-labelledby="giao-hang-h">
                  <Heading as="h2" role="heading" id="giao-hang-h">
                    {t.shippingHeading}
                  </Heading>

                  {shipping.steps.length > 0 ? (
                    <div className="ip-block">
                      <Heading as="h3" role="heading" className="ip-sub">
                        {t.stepsHeading}
                      </Heading>
                      <ol className="ip-steps">
                        {shipping.steps.map((s, i) => (
                          <li key={s.title} className="ip-step">
                            <span className="ip-step-mark">
                              <StepMark index={i} />
                            </span>
                            <div className="ip-step-text">
                              <p className="ip-step-title">{s.title}</p>
                              {s.text ? <p className="ip-step-body">{s.text}</p> : null}
                            </div>
                          </li>
                        ))}
                      </ol>
                    </div>
                  ) : null}

                  {shipping.zones.length > 0 ? (
                    <div className="ip-block">
                      <Heading as="h3" role="heading" className="ip-sub">
                        {t.zonesHeading}
                      </Heading>
                      <table className="ip-zones">
                        <thead>
                          <tr>
                            <th scope="col">{t.zoneArea}</th>
                            <th scope="col">{t.zoneLead}</th>
                            <th scope="col">{t.zoneNote}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {shipping.zones.map((z) => (
                            <tr key={z.area}>
                              <th scope="row">{z.area}</th>
                              <td className="ip-zone-lead">{z.leadTime}</td>
                              <td className="ip-zone-note">{z.note}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : legacyRows.length > 0 ? (
                    <dl className="pg-facts">
                      {legacyRows.map((r) => (
                        <div key={r.label} className="pg-fact">
                          <dt>{r.label}</dt>
                          <dd>{r.value}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : null}

                  {shipping.fee || shipping.packaging ? (
                    <div className="ip-pack">
                      <div className="ip-pack-text">
                        {shipping.fee ? (
                          <div>
                            <Heading as="h3" role="heading" className="ip-sub">
                              {t.feeHeading}
                            </Heading>
                            <Text>{shipping.fee}</Text>
                          </div>
                        ) : null}
                        {shipping.packaging ? (
                          <div>
                            <Heading as="h3" role="heading" className="ip-sub">
                              {t.packagingHeading}
                            </Heading>
                            <Text>{shipping.packaging}</Text>
                          </div>
                        ) : null}
                      </div>
                      <div className="ip-pack-art" aria-hidden="true">
                        <GiftBox
                          cols={3}
                          rows={2}
                          open={0}
                          lidOverlay={<Ribbon cols={3} rows={2} state="tied" />}
                        />
                      </div>
                    </div>
                  ) : null}
                </section>
              ) : null}

              {visible['doi-tra'] ? (
                <section id="doi-tra" className="ip-section" aria-labelledby="doi-tra-h">
                  <Heading as="h2" role="heading" id="doi-tra-h">
                    {t.returnsHeading}
                  </Heading>
                  {returns.eligible.length + returns.howTo.length + returns.exclusions.length ===
                  0 ? (
                    <Text>{returns.policy}</Text>
                  ) : (
                    <div className="ip-returns">
                      {returns.eligible.length > 0 ? (
                        <div className="ip-ret ip-ret-yes">
                          <Heading as="h3" role="heading" className="ip-sub">
                            {t.eligibleHeading}
                          </Heading>
                          <BulletList items={returns.eligible} />
                        </div>
                      ) : null}
                      {returns.howTo.length > 0 ? (
                        <div className="ip-ret ip-ret-how">
                          <Heading as="h3" role="heading" className="ip-sub">
                            {t.howToHeading}
                          </Heading>
                          <ol className="ip-steps ip-steps-3">
                            {returns.howTo.map((h, i) => (
                              <li key={h} className="ip-step">
                                <span className="ip-step-mark">
                                  <ReturnMark index={i} />
                                </span>
                                <div className="ip-step-text">
                                  <p className="ip-step-title ip-step-title-plain">{h}</p>
                                </div>
                              </li>
                            ))}
                          </ol>
                        </div>
                      ) : null}
                      {returns.exclusions.length > 0 ? (
                        <div className="ip-ret ip-ret-no">
                          <Heading as="h3" role="heading" className="ip-sub">
                            {t.exclusionsHeading}
                          </Heading>
                          <BulletList items={returns.exclusions} />
                        </div>
                      ) : null}
                    </div>
                  )}
                </section>
              ) : null}

              {visible['bao-quan'] ? (
                <section
                  id="bao-quan"
                  className="ip-section ip-storage theme-paper"
                  aria-labelledby="bao-quan-h"
                >
                  <Heading as="h2" role="heading" id="bao-quan-h">
                    {t.storageHeading}
                  </Heading>
                  <div className="ip-gauge">
                    <div
                      className="ip-gauge-fig"
                      style={{ ['--band' as string]: `${bandCenterPct}%` }}
                    >
                      <Gauge min={range.min} max={range.max} label={t.gaugeLabel(rangeText)} />
                      <div className="ip-gauge-num">
                        <p className="ip-gauge-value">{rangeText}</p>
                        <p className="ip-gauge-cap">{t.storageLead}</p>
                      </div>
                    </div>
                    {storage.shelfLife ? <p className="ip-shelf">{storage.shelfLife}</p> : null}
                  </div>

                  {storage.do.length + storage.avoid.length > 0 ? (
                    <div className="ip-doavoid">
                      {storage.do.length > 0 ? (
                        <div>
                          <Heading as="h3" role="heading" className="ip-sub">
                            {t.doHeading}
                          </Heading>
                          <BulletList items={storage.do} />
                        </div>
                      ) : null}
                      {storage.avoid.length > 0 ? (
                        <div>
                          <Heading as="h3" role="heading" className="ip-sub">
                            {t.avoidHeading}
                          </Heading>
                          <BulletList items={storage.avoid} />
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <BulletList items={storage.tips} />
                  )}

                  {storage.enjoy.length > 0 ? (
                    <div className="ip-enjoy">
                      <Heading as="h3" role="heading" className="ip-sub">
                        {t.enjoyHeading}
                      </Heading>
                      <BulletList items={storage.enjoy} />
                    </div>
                  ) : null}
                </section>
              ) : null}
            </div>
          </div>

          <section id="thong-tin-cuoi" className="ip-closing" aria-labelledby="ip-closing-h">
            <FoilDivider className="ip-closing-rule" />
            <Heading as="h2" role="heading" id="ip-closing-h">
              {info.closing.heading}
            </Heading>
            <Text tone="muted">{info.closing.body}</Text>
            <div className="ip-closing-actions">
              <ChatAskButton>{info.closing.askAssistant}</ChatAskButton>
              <Button href="/lien-he" variant="ghost">
                {info.closing.contact}
              </Button>
            </div>
          </section>
        </div>
      </Container>
    </main>
  );
}
