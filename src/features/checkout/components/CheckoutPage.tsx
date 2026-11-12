'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Container, Heading, Text } from '@/components/ui';
import { GiftBox, Ribbon } from '@/features/box-builder/components/box';
import { hydrateBoxStore, pricing as computePricing, useBoxStore } from '@/features/box-builder';
import type { BoxOption } from '@/lib/schemas/box';
import type { Chocolate } from '@/lib/schemas/chocolate';
import type { Customer } from '@/lib/schemas/order';
import { getOrderService, type OrderService } from '@/lib/services/order';
import { checkout as t } from '@/content/checkout';
import { buildOrderPayload, groupPieces, isBoxComplete, type BoxSnapshot } from '../model/payload';
import { CustomerForm } from './CustomerForm';
import { OrderSummary } from './OrderSummary';
import './checkout.css';

type Success = { orderId: string; box: BoxOption };

/**
 * Trang đặt hàng (mock). Đọc hộp từ store đã lưu (hydrate + làm sạch theo catalog), hiển thị
 * tóm tắt + form, gửi qua OrderService. Thành công: hiện lời cảm ơn rồi mới xoá hộp trong store.
 */
export function CheckoutPage({
  chocolates,
  boxes,
  service,
}: {
  chocolates: readonly Chocolate[];
  boxes: readonly BoxOption[];
  /** Mặc định chọn theo biến môi trường (mock khi chưa cấu hình). */
  service?: OrderService;
}) {
  const size = useBoxStore((s) => s.size);
  const slots = useBoxStore((s) => s.slots);
  const message = useBoxStore((s) => s.message);
  const from = useBoxStore((s) => s.from);
  const to = useBoxStore((s) => s.to);

  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState<Success | null>(null);
  const [now] = useState(() => new Date());
  const successHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    let cancelled = false;
    void hydrateBoxStore().then(() => {
      if (cancelled) return;
      useBoxStore.getState().sanitizeWith(chocolates, boxes);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [chocolates, boxes]);

  // Xoá hộp chỉ SAU khi màn hình thành công đã được vẽ.
  useEffect(() => {
    if (!success) return;
    successHeadingRef.current?.focus();
    useBoxStore.getState().reset();
  }, [success]);

  const snapshot: BoxSnapshot = useMemo(
    () => ({ size, slots, message, from, to }),
    [size, slots, message, from, to],
  );
  const box = boxes.find((b) => b.size === size);
  const complete = isBoxComplete(snapshot, boxes);
  const price = useMemo(
    () => computePricing({ size, slots }, chocolates, boxes),
    [size, slots, chocolates, boxes],
  );
  const pieces = useMemo(() => groupPieces(slots, chocolates), [slots, chocolates]);

  const handleSubmit = async (customer: Customer, honeypot: string) => {
    if (!box || !complete) return;
    setSubmitting(true);
    setSubmitError(null);
    const payload = buildOrderPayload({ customer, box: snapshot, chocolates, boxes });
    if (honeypot) payload.website = honeypot;
    const result = await (service ?? getOrderService()).submitOrder(payload);
    setSubmitting(false);
    if (result.ok) setSuccess({ orderId: result.orderId, box });
    else setSubmitError(result.error);
  };

  return (
    <div className="co">
      <Container className="co-inner">
        {!success ? (
          <div className="co-top">
            <Link href="/#builder" className="co-back">
              {t.backToBuilder}
            </Link>
          </div>
        ) : null}

        {success ? (
          <section className="co-done" aria-labelledby="co-done-h">
            <div className="co-thumb co-thumb-done" aria-hidden="true">
              <GiftBox
                cols={success.box.cols}
                rows={success.box.rows}
                open={0}
                lidOverlay={<Ribbon cols={success.box.cols} rows={success.box.rows} state="tied" />}
              />
            </div>
            <Heading as="h1" role="title" id="co-done-h" ref={successHeadingRef} tabIndex={-1}>
              {t.success.heading}
            </Heading>
            <p className="co-orderid">
              <span className="co-muted">{t.success.orderId}</span>{' '}
              <strong className="tabular">{success.orderId}</strong>
            </p>
            <Text>{t.success.next}</Text>
            <Button href="/" variant="ghost">
              {t.home}
            </Button>
          </section>
        ) : !ready ? (
          <p className="co-muted" role="status">
            {t.loading}
          </p>
        ) : !box || !complete ? (
          <section className="co-empty" aria-labelledby="co-empty-h">
            <Heading as="h1" role="title" id="co-empty-h">
              {t.empty.heading}
            </Heading>
            <Text tone="muted">
              {box ? t.empty.notFull(price.filled, box.size) : t.empty.noBox}
            </Text>
            <Button href="/#builder" size="lg">
              {t.empty.action}
            </Button>
          </section>
        ) : (
          <>
            <header className="co-head">
              <Heading as="h1" role="title">
                {t.heading}
              </Heading>
              <Text tone="muted">{t.intro}</Text>
            </header>
            <div className="co-layout">
              <OrderSummary
                box={box}
                pieces={pieces}
                message={message}
                from={from}
                to={to}
                boxPrice={price.boxPrice}
                piecesPrice={price.piecesPrice}
                total={price.total}
              />
              <CustomerForm
                now={now}
                submitting={submitting}
                error={submitError}
                onSubmit={(c, hp) => void handleSubmit(c, hp)}
              />
            </div>
          </>
        )}
      </Container>
    </div>
  );
}
