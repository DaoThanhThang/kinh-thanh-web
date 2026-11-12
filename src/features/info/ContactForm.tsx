'use client';

import { useMemo, useRef, useState, type FormEvent } from 'react';
import { Button, Heading } from '@/components/ui';
import { info } from '@/content/info';
import { contactSchema, MESSAGE_MAX, type ContactInput } from '@/lib/schemas/contact';
import { getContactService, type ContactService } from '@/lib/services/contact';

const t = info.form;
type Field = keyof ContactInput;
const ORDER: Field[] = ['name', 'contact', 'message'];
const EMPTY: ContactInput = { name: '', contact: '', message: '' };
const id = (f: Field) => `ct-${f}`;

/**
 * Form liên hệ. Kiểm bằng Zod (lỗi hiện sau khi rời ô hoặc sau lần gửi đầu, focus ô sai đầu tiên);
 * gửi qua ContactService (mock: chỉ ghi console). Thất bại giữ nguyên dữ liệu và cho gửi lại.
 */
export function ContactForm({ service }: { service?: ContactService }) {
  const [values, setValues] = useState<ContactInput>(EMPTY);
  const [touched, setTouched] = useState<ReadonlySet<Field>>(new Set());
  const [attempted, setAttempted] = useState(false);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const doneRef = useRef<HTMLHeadingElement>(null);

  const parsed = useMemo(() => contactSchema.safeParse(values), [values]);
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
  const set = (f: Field) => (e: { target: { value: string } }) =>
    setValues((v) => ({ ...v, [f]: e.target.value }));
  const blur = (f: Field) => () => setTouched((s) => (s.has(f) ? s : new Set(s).add(f)));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (status === 'submitting') return;
    setAttempted(true);
    if (!parsed.success) {
      const first = ORDER.find((f) => errors[f]);
      if (first) document.getElementById(id(first))?.focus();
      return;
    }
    setStatus('submitting');
    let ok = false;
    try {
      const res = await (service ?? getContactService()).sendMessage({
        ...parsed.data,
        createdAt: new Date().toISOString(),
      });
      ok = res.ok;
    } catch {
      ok = false;
    }
    if (ok) {
      setStatus('success');
      requestAnimationFrame(() => doneRef.current?.focus());
    } else {
      setStatus('error');
    }
  };

  const reset = () => {
    setValues(EMPTY);
    setTouched(new Set());
    setAttempted(false);
    setStatus('idle');
  };

  if (status === 'success') {
    return (
      <div className="ct-done" role="status">
        <Heading as="h2" role="heading" ref={doneRef} tabIndex={-1}>
          {t.successHeading}
        </Heading>
        <p className="ct-muted">{t.successBody}</p>
        <Button variant="ghost" onClick={reset}>
          {t.another}
        </Button>
      </div>
    );
  }

  const a11y = (f: Field, hint?: string) => {
    const err = shown(f);
    const ids = [hint ? `${id(f)}-hint` : null, err ? `${id(f)}-err` : null].filter(Boolean);
    return {
      id: id(f),
      name: f,
      'aria-required': true as const,
      'aria-invalid': err ? (true as const) : undefined,
      'aria-describedby': ids.length ? ids.join(' ') : undefined,
      onBlur: blur(f),
    };
  };
  const label = (f: Field, text: string, hint?: string) => (
    <div className="ct-label-row">
      <label htmlFor={id(f)} className="ct-label">
        {text}
        <span className="ct-req" aria-hidden="true">
          {' '}
          *
        </span>
      </label>
      {hint ? (
        <span id={`${id(f)}-hint`} className="ct-hint">
          {hint}
        </span>
      ) : null}
    </div>
  );
  const err = (f: Field) => {
    const m = shown(f);
    return m ? (
      <p id={`${id(f)}-err`} className="ct-error">
        {m}
      </p>
    ) : null;
  };
  const busy = status === 'submitting';

  return (
    <form className="ct-form" noValidate onSubmit={submit} aria-labelledby="ct-form-h">
      <Heading as="h2" role="heading" id="ct-form-h">
        {t.heading}
      </Heading>
      <p className="ct-muted">{t.requiredNote}</p>
      <fieldset className="ct-fields" disabled={busy}>
        <div className="ct-field">
          {label('name', t.name)}
          <input
            {...a11y('name')}
            className="ct-input"
            type="text"
            autoComplete="name"
            value={values.name}
            onChange={set('name')}
          />
          {err('name')}
        </div>
        <div className="ct-field">
          {label('contact', t.contact, t.contactHint)}
          <input
            {...a11y('contact', t.contactHint)}
            className="ct-input"
            type="text"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            value={values.contact}
            onChange={set('contact')}
          />
          {err('contact')}
        </div>
        <div className="ct-field">
          {label('message', t.message)}
          <textarea
            {...a11y('message')}
            className="ct-input ct-textarea"
            rows={5}
            maxLength={MESSAGE_MAX + 200}
            value={values.message}
            onChange={set('message')}
          />
          {err('message')}
        </div>
      </fieldset>
      {status === 'error' ? (
        <p className="ct-error" role="alert">
          {t.submitError}
        </p>
      ) : null}
      <Button type="submit" size="lg" loading={busy} className="ct-submit">
        {busy ? t.submitting : status === 'error' ? t.retry : t.submit}
      </Button>
    </form>
  );
}
