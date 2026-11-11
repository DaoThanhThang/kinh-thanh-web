import type { Metadata } from 'next';
import { Button, Container, FoilDivider, Heading, Text } from '@/components/ui';
import { CitadelPanorama } from '@/features/box-builder/components/box/art/CitadelPanorama';
import { site } from '@/content/site';

export const metadata: Metadata = { title: site.notFound.title };

export default function NotFound() {
  const t = site.notFound;
  return (
    <main id="main" className="nf">
      <Container className="nf-inner">
        <CitadelPanorama className="nf-art" />
        <Heading as="h1" role="title">
          {t.heading}
        </Heading>
        <FoilDivider className="max-w-xs" />
        <Text tone="muted">{t.body}</Text>
        <Button href="/" size="lg">
          {t.home}
        </Button>
      </Container>
    </main>
  );
}
