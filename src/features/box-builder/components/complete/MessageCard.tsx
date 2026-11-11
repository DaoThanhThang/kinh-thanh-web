import { Logo } from '@/components/ui';
import './complete.css';
import { complete as t } from '@/content/complete';
import { Waves } from '../box/art/Waves';

/**
 * Thiệp lời nhắn theo thiệp nhỏ trong ảnh bao bì: nền cacao, khung foil hai nét, cổng thành (logo)
 * và đồi sóng ở chân. Lời nhắn đặt chữ serif nghiêng; "Gửi đến" ở đầu, "Gửi từ" ở cuối (nếu có).
 */
export function MessageCard({
  message,
  from,
  to,
  className,
}: {
  message: string;
  from: string;
  to: string;
  className?: string;
}) {
  const hasMessage = message.trim().length > 0;
  return (
    <figure
      className={['cc-card', className].filter(Boolean).join(' ')}
      aria-label={t.previewLabel}
    >
      <Waves className="cc-waves" />
      <div className="cc-logo">
        <Logo size="md" />
      </div>
      <div className="cc-body">
        {to.trim() ? <p className="cc-to">{t.cardTo(to.trim())}</p> : null}
        <p className="cc-message" data-empty={hasMessage ? undefined : 'true'}>
          {hasMessage ? message : t.cardEmpty}
        </p>
        {from.trim() ? <p className="cc-from">{t.cardFrom(from.trim())}</p> : null}
      </div>
    </figure>
  );
}
