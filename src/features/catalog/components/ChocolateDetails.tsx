'use client';

import { useId } from 'react';
import { Button, Heading, Text } from '@/components/ui';
import { Dialog } from '@/components/ui/Dialog';
import type { Chocolate } from '@/lib/schemas/chocolate';
import { formatVnd } from '@/lib/utils/formatVnd';
import { builder as t } from '@/content/builder';
import { ChocolateImage } from './ChocolateImage';

/** Chi tiết một viên: bảng trượt từ đáy trên mobile, hộp giữa màn hình trên desktop. */
export function ChocolateDetails({
  chocolate,
  onClose,
}: {
  chocolate: Chocolate | null;
  onClose: () => void;
}) {
  const titleId = useId();
  const c = chocolate;
  return (
    <Dialog open={c !== null} onClose={onClose} titleId={titleId} variant="sheet">
      {c ? (
        <div className="bt-details">
          <div className="bt-details-media">
            <ChocolateImage src={c.image} alt={c.name} width={240} height={240} loading="eager" />
          </div>
          <div className="bt-details-body">
            <Heading as="h3" id={titleId}>
              {c.name}
            </Heading>
            <p className="bt-price tabular">{formatVnd(c.price)}</p>
            <Text>{c.description}</Text>
            {c.flavorNotes.length > 0 ? (
              <div>
                <h4 className="type-label text-text-muted">{t.detailsFlavor}</h4>
                <Text className="mt-1">{c.flavorNotes.join(', ')}</Text>
              </div>
            ) : null}
            <div>
              <h4 className="type-label text-text-muted">{t.detailsAllergens}</h4>
              <Text className="mt-1" tone={c.allergens === null ? 'muted' : 'default'}>
                {c.allergens === null
                  ? t.detailsAllergensNull
                  : c.allergens.length === 0
                    ? t.detailsAllergensNone
                    : t.detailsContains(c.allergens.join(', '))}
              </Text>
            </div>
            <Button variant="ghost" onClick={onClose} data-autofocus className="self-start">
              {t.detailsClose}
            </Button>
          </div>
        </div>
      ) : null}
    </Dialog>
  );
}
