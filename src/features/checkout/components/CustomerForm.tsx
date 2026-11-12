'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { Button, Heading } from '@/components/ui';
import { checkout } from '@/content/checkout';
import {
  createCustomerSchema,
  earliestDeliveryDate,
  type Customer,
  type CustomerInput,
  type PaymentMethod,
} from '@/lib/schemas/order';

const t = checkout.form;

type Field =
  'name' | 'phone' | 'email' | 'address' | 'province' | 'desiredDate' | 'note' | 'payment';

/** Thứ tự trên màn hình: dùng để focus ô lỗi đầu tiên. */
const ORDER: Field[] = [
  'name',
  'phone',
  'email',
  'address',
  'province',
  'desiredDate',
  'note',
  'payment',
];

const EMPTY: CustomerInput = {
  name: '',
  phone: '',
  email: '',
  address: '',
  province: '',
  desiredDate: '',
  note: '',
  payment: 'cod',
};

const fieldId = (f: Field) => `co-${f}`;

/**
 * Form khách hàng. Kiểm tra bằng Zod (createCustomerSchema), lỗi hiện ngay dưới ô (sau khi rời ô
 * hoặc sau lần gửi đầu); gửi lỗi thì focus ô sai đầu tiên. `noValidate` để dùng thông báo tiếng Việt
 * của mình thay vì bong bóng của trình duyệt. Dữ liệu nhập luôn được giữ, kể cả khi gửi thất bại.
 */
export function CustomerForm({
  now,
  submitting,
  error,
  onSubmit,
}: {
  now: Date;
  submitting: boolean;
  /** Lỗi từ OrderService (không phải lỗi nhập liệu). */
  error: string | null;
  /** `honeypot`: giá trị ô bẫy bot (người thật luôn để rỗng). */
  onSubmit: (customer: Customer, honeypot: string) => void;
}) {
  const [values, setValues] = useState<CustomerInput>(EMPTY);
  const [touched, setTouched] = useState<ReadonlySet<Field>>(new Set());
  const [attempted, setAttempted] = useState(false);
  const [honeypot, setHoneypot] = useState('');

  const schema = useMemo(() => createCustomerSchema(now), [now]);
  const parsed = useMemo(() => schema.safeParse(values), [schema, values]);
  const errors = useMemo(() => {
    const out: Partial<Record<Field, string>> = {};
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as Field | undefined;
        if (key && !(key in out)) out[key] = issue.message;
      }
    }
    return out;
  }, [parsed]);
  const shown = (f: Field) => (attempted || touched.has(f) ? errors[f] : undefined);
  const minDate = earliestDeliveryDate(now);

  const set = (f: Field) => (e: { target: { value: string } }) =>
    setValues((v) => ({ ...v, [f]: e.target.value }));
  const blur = (f: Field) => () => setTouched((s) => (s.has(f) ? s : new Set(s).add(f)));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setAttempted(true);
    if (!parsed.success) {
      const first = ORDER.find((f) => errors[f]);
      if (first) document.getElementById(fieldId(first))?.focus();
      return;
    }
    onSubmit(parsed.data, honeypot);
  };

  /** Thuộc tính chung của một ô: id, aria-invalid, aria-describedby (gợi ý + lỗi). */
  const a11y = (f: Field, hint?: string) => {
    const err = shown(f);
    const ids = [hint ? `${fieldId(f)}-hint` : null, err ? `${fieldId(f)}-err` : null].filter(
      Boolean,
    );
    return {
      id: fieldId(f),
      name: f,
      'aria-invalid': err ? (true as const) : undefined,
      'aria-describedby': ids.length ? ids.join(' ') : undefined,
      onBlur: blur(f),
    };
  };

  const label = (f: Field, text: string, required = false, hint?: string) => (
    <div className="co-label-row">
      <label htmlFor={fieldId(f)} className="co-label">
        {text}
        {required ? (
          <span className="co-req" aria-hidden="true">
            {' '}
            *
          </span>
        ) : null}
      </label>
      {hint ? (
        <span id={`${fieldId(f)}-hint`} className="co-hint">
          {hint}
        </span>
      ) : null}
    </div>
  );

  const err = (f: Field) => {
    const m = shown(f);
    return m ? (
      <p id={`${fieldId(f)}-err`} className="co-error">
        {m}
      </p>
    ) : null;
  };

  const paymentOptions: { value: PaymentMethod; label: string }[] = [
    { value: 'cod', label: t.paymentCod },
    { value: 'transfer', label: t.paymentTransfer },
  ];

  return (
    <form className="co-form" noValidate onSubmit={handleSubmit} aria-labelledby="co-form-h">
      <Heading as="h2" role="heading" id="co-form-h">
        {t.heading}
      </Heading>
      <p className="co-muted">{t.requiredNote}</p>

      <fieldset className="co-fields" disabled={submitting}>
        <div className="co-field">
          {label('name', t.name, true)}
          <input
            {...a11y('name')}
            className="co-input"
            type="text"
            autoComplete="name"
            aria-required="true"
            value={values.name}
            onChange={set('name')}
          />
          {err('name')}
        </div>

        <div className="co-field">
          {label('phone', t.phone, true, t.phoneHint)}
          <input
            {...a11y('phone', t.phoneHint)}
            className="co-input"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            aria-required="true"
            value={values.phone}
            onChange={set('phone')}
          />
          {err('phone')}
        </div>

        <div className="co-field">
          {label('email', t.email, false, t.emailHint)}
          <input
            {...a11y('email', t.emailHint)}
            className="co-input"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            value={values.email}
            onChange={set('email')}
          />
          {err('email')}
        </div>

        <div className="co-field">
          {label('address', t.address, true, t.addressHint)}
          <textarea
            {...a11y('address', t.addressHint)}
            className="co-input co-textarea"
            rows={2}
            autoComplete="street-address"
            aria-required="true"
            value={values.address}
            onChange={set('address')}
          />
          {err('address')}
        </div>

        <div className="co-pair">
          <div className="co-field">
            {label('province', t.province, true)}
            <input
              {...a11y('province')}
              className="co-input"
              type="text"
              autoComplete="address-level1"
              aria-required="true"
              value={values.province}
              onChange={set('province')}
            />
            {err('province')}
          </div>
          <div className="co-field">
            {label('desiredDate', t.date, false)}
            <input
              {...a11y('desiredDate', t.dateHint)}
              className="co-input"
              type="date"
              min={minDate}
              autoComplete="off"
              value={values.desiredDate}
              onChange={set('desiredDate')}
            />
            <span id="co-desiredDate-hint" className="co-hint">
              {t.dateHint}
            </span>
            {err('desiredDate')}
          </div>
        </div>

        <div className="co-field">
          {label('note', t.note, false, t.noteHint)}
          <textarea
            {...a11y('note', t.noteHint)}
            className="co-input co-textarea"
            rows={3}
            autoComplete="off"
            value={values.note}
            onChange={set('note')}
          />
          {err('note')}
        </div>

        {/* Bẫy bot: ẩn với người dùng và trình đọc màn hình, bot hay điền mọi ô. */}
        <div className="co-hp" aria-hidden="true">
          <label>
            Website
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </label>
        </div>

        <fieldset className="co-pay">
          <legend className="co-label">{t.paymentLegend}</legend>
          <div className="co-pay-options">
            {paymentOptions.map((o) => (
              <label key={o.value} className="co-radio">
                <input
                  type="radio"
                  name="payment"
                  value={o.value}
                  checked={values.payment === o.value}
                  onChange={() => setValues((v) => ({ ...v, payment: o.value }))}
                />
                <span className="co-radio-face">{o.label}</span>
              </label>
            ))}
          </div>
          {values.payment === 'transfer' ? (
            <p className="co-muted" id="co-pay-note">
              {t.paymentTransferNote}
            </p>
          ) : null}
        </fieldset>
      </fieldset>

      <div className="co-submit">
        {error ? (
          <p className="co-error co-submit-error" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit" size="lg" loading={submitting} className="co-submit-btn">
          {submitting ? t.submitting : error ? t.retry : t.submit}
        </Button>
      </div>
    </form>
  );
}
