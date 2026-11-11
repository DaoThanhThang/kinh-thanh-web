import { Heading } from '@/components/ui';
import { GiftBox, Ribbon } from '@/features/box-builder/components/box';
import type { BoxOption } from '@/lib/schemas/box';
import { checkout } from '@/content/checkout';
import { formatVnd } from '@/lib/utils/formatVnd';
import type { PieceLine } from '../model/payload';

const t = checkout.summary;

/**
 * Tóm tắt đơn: hộp đóng có ruy băng (tĩnh), danh sách viên theo loại, lời nhắn và giá.
 * Chỉ hiển thị, nhận mọi thứ qua props nên dùng được cả khi store đã xoá (màn hình thành công).
 */
export function OrderSummary({
  box,
  pieces,
  message,
  from,
  to,
  boxPrice,
  piecesPrice,
  total,
}: {
  box: BoxOption;
  pieces: readonly PieceLine[];
  message: string;
  from: string;
  to: string;
  boxPrice: number;
  piecesPrice: number;
  total: number;
}) {
  const hasCard = message.trim() !== '' || from.trim() !== '' || to.trim() !== '';
  return (
    <section className="co-summary" aria-labelledby="co-summary-h">
      <Heading as="h2" role="heading" id="co-summary-h">
        {t.heading}
      </Heading>

      <div className="co-thumb" aria-hidden="true">
        <GiftBox
          cols={box.cols}
          rows={box.rows}
          open={0}
          lidOverlay={<Ribbon cols={box.cols} rows={box.rows} state="tied" />}
        />
      </div>

      <p className="co-boxline">{t.boxLine(box.size)}</p>

      <div className="co-block">
        <h3 className="co-subhead">{t.piecesHeading}</h3>
        <ul className="co-pieces tabular">
          {pieces.map((p) => (
            <li key={p.id}>
              <span>{t.pieceLine(p.name, p.qty)}</span>
              <span>{formatVnd(p.unitPrice * p.qty)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="co-block">
        <h3 className="co-subhead">{t.messageHeading}</h3>
        {hasCard ? (
          <blockquote className="co-quote">
            {to.trim() ? <p className="co-quote-meta">{t.to(to.trim())}</p> : null}
            {message.trim() ? <p className="co-quote-text">{message}</p> : null}
            {from.trim() ? (
              <p className="co-quote-meta co-quote-from">{t.from(from.trim())}</p>
            ) : null}
          </blockquote>
        ) : (
          <p className="co-muted">{t.noMessage}</p>
        )}
      </div>

      <dl className="co-price tabular">
        <div>
          <dt>{t.priceBox}</dt>
          <dd>{formatVnd(boxPrice)}</dd>
        </div>
        <div>
          <dt>{t.pricePieces}</dt>
          <dd>{formatVnd(piecesPrice)}</dd>
        </div>
        <div className="co-price-total">
          <dt>{t.total}</dt>
          <dd>{formatVnd(total)}</dd>
        </div>
      </dl>
    </section>
  );
}
