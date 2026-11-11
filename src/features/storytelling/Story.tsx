import { Button, Container, Heading, Text } from '@/components/ui';
import { CitadelPanorama } from '@/features/box-builder/components/box/art/CitadelPanorama';
import { DongSonDrum } from '@/features/box-builder/components/box/art/DongSonDrum';
import { LacBird } from '@/features/box-builder/components/box/art/LacBird';
import { story } from '@/content/story';
import './story.css';

/**
 * "Câu chuyện": đoạn tĩnh sau cảnh mở nắp, trước builder. Nền kem ngà (theme-paper) để ngắt nhịp,
 * bố cục bất đối xứng với họa tiết lớn, không thẻ, không đánh số (D38).
 */
export function Story() {
  return (
    <section id="cau-chuyen" className="theme-paper story" aria-labelledby="story-heading">
      <Container className="story-inner">
        <header className="story-head">
          <Heading as="h2" id="story-heading">
            {story.heading}
          </Heading>
          <Text className="story-intro">{story.intro}</Text>
        </header>

        <div className="story-row story-drum">
          <div className="story-text">
            <Heading as="h3">{story.drum.title}</Heading>
            {story.drum.body.map((p) => (
              <Text key={p}>{p}</Text>
            ))}
          </div>
          <div className="story-art story-art-drum" role="img" aria-label={story.drum.alt}>
            <DongSonDrum />
          </div>
        </div>

        <div className="story-row story-bird">
          <div className="story-art story-art-bird" aria-hidden="true">
            <LacBird className="story-bird-main" />
            <LacBird className="story-bird-small" />
            <LacBird className="story-bird-third" />
          </div>
          <div className="story-text">
            <Heading as="h3">{story.bird.title}</Heading>
            {story.bird.body.map((p) => (
              <Text key={p}>{p}</Text>
            ))}
          </div>
        </div>

        <div className="story-row story-gate">
          <div className="story-text">
            <Heading as="h3">{story.gate.title}</Heading>
            {story.gate.body.map((p) => (
              <Text key={p}>{p}</Text>
            ))}
            <Button href="#builder" variant="ghost" className="story-cta">
              {story.cta}
            </Button>
          </div>
          <div className="story-art story-art-gate" aria-hidden="true">
            <CitadelPanorama />
          </div>
        </div>
      </Container>
    </section>
  );
}
