import { orderEmail as t } from '@/content/order-email';
import { formatVnd } from '@/lib/utils/formatVnd';
import type { OrderRecord } from '@/lib/order-server/types';
import { formatIsoDate, formatShopDateTime } from '@/lib/order-server/time';
import { esc, escMultiline, headerSafe } from './html';
import { MAIL_COLORS as C } from './theme';

/** Content-ID của ảnh khay nhúng trong email. */
export const TRAY_CID = 'khay-tray@kinhthanh';

export type RenderedEmail = { subject: string; html: string; text: string };

const FONT = "'Be Vietnam Pro',Arial,Helvetica,sans-serif";
const SERIF = "Georgia,'Times New Roman',serif";
const WIDTH = 640;

const paymentLabel = (o: OrderRecord) =>
  o.payment === 'cod' ? t.shop.paymentCod : t.shop.paymentTransfer;

// ---- Khối HTML dùng chung (table + style inline, an toàn cho Gmail/Outlook) --------------------

function shell(title: string, body: string): string {
  return (
    `<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width,initial-scale=1">` +
    `<meta name="color-scheme" content="light"><title>${esc(title)}</title></head>` +
    `<body style="margin:0;padding:0;background:${C.ivory200};">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.ivory200};">` +
    `<tr><td align="center" style="padding:24px 12px;">` +
    `<table role="presentation" width="${WIDTH}" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:${WIDTH}px;background:${C.ivory50};border-radius:8px;">` +
    body +
    `</table></td></tr></table></body></html>`
  );
}

function header(title: string, orderId: string): string {
  return (
    `<tr><td style="background:${C.cacao950};padding:28px 28px 24px;border-radius:8px 8px 0 0;border-bottom:3px solid ${C.foil500};">` +
    `<div style="font-family:${SERIF};font-size:13px;letter-spacing:3px;text-transform:uppercase;color:${C.foil400};">${esc(t.brand)}</div>` +
    `<div style="font-family:${SERIF};font-size:26px;line-height:1.25;color:${C.ivory50};padding-top:8px;">${esc(title)}</div>` +
    `<div style="font-family:${FONT};font-size:20px;font-weight:bold;color:${C.foil300};padding-top:6px;letter-spacing:1px;">${esc(orderId)}</div>` +
    `</td></tr>`
  );
}

function section(heading: string, inner: string): string {
  return (
    `<tr><td style="padding:24px 28px 0;">` +
    `<div style="font-family:${SERIF};font-size:18px;color:${C.cacao900};padding-bottom:10px;border-bottom:1px solid ${C.foil500};margin-bottom:12px;">${esc(heading)}</div>` +
    inner +
    `</td></tr>`
  );
}

function trayImage(order: OrderRecord, cid: string): string {
  return (
    `<img src="cid:${esc(cid)}" alt="${esc(`Khay ${order.box.name} theo đơn ${order.orderId}`)}" width="${WIDTH - 56}" ` +
    `style="display:block;width:100%;max-width:${WIDTH - 56}px;height:auto;border:0;border-radius:6px;background:${C.cacao950};">`
  );
}

/** Hàng "nhãn: giá trị" trong bảng thông tin. `valueHtml` đã được escape. */
function infoRow(label: string, valueHtml: string): string {
  return (
    `<tr>` +
    `<td valign="top" width="150" style="font-family:${FONT};font-size:14px;line-height:1.5;color:${C.cacao600};padding:5px 12px 5px 0;">${esc(label)}</td>` +
    `<td valign="top" style="font-family:${FONT};font-size:15px;line-height:1.5;color:${C.cacao900};padding:5px 0;">${valueHtml}</td>` +
    `</tr>`
  );
}

function infoTable(rows: string[]): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows.join('')}</table>`;
}

const cellStyle = (extra = '') =>
  `font-family:${FONT};font-size:14px;line-height:1.4;color:${C.cacao900};padding:7px 8px;${extra}`;

function cellsTable(order: OrderRecord): string {
  const head =
    `<tr style="background:${C.cacao900};">` +
    `<th align="left" width="52" style="${cellStyle(`color:${C.foil300};font-weight:bold;`)}">${esc(t.shop.cellNumber)}</th>` +
    `<th align="left" style="${cellStyle(`color:${C.foil300};font-weight:bold;`)}">${esc(t.shop.cellPiece)}</th></tr>`;
  const rows = order.cells
    .map(
      (c, i) =>
        `<tr style="background:${i % 2 ? C.ivory100 : C.ivory50};">` +
        `<td style="${cellStyle('font-weight:bold;')}">${c.n}</td>` +
        `<td style="${cellStyle()}">${esc(c.name)} <span style="color:${C.cacao600};">(${esc(c.id)})</span></td></tr>`,
    )
    .join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${C.ivory200};">${head}${rows}</table>`;
}

function summaryTable(order: OrderRecord): string {
  const th = (label: string, align: 'left' | 'right') =>
    `<th align="${align}" style="${cellStyle(`color:${C.foil300};font-weight:bold;`)}">${esc(label)}</th>`;
  const head = `<tr style="background:${C.cacao900};">${th(t.shop.colPiece, 'left')}${th(t.shop.colQty, 'right')}${th(t.shop.colUnit, 'right')}${th(t.shop.colLine, 'right')}</tr>`;
  const lines = order.lines
    .map(
      (l, i) =>
        `<tr style="background:${i % 2 ? C.ivory100 : C.ivory50};">` +
        `<td style="${cellStyle()}">${esc(l.name)} <span style="color:${C.cacao600};">(${esc(l.id)})</span></td>` +
        `<td align="right" style="${cellStyle()}">${l.qty}</td>` +
        `<td align="right" style="${cellStyle('white-space:nowrap;')}">${esc(formatVnd(l.unitPrice))}</td>` +
        `<td align="right" style="${cellStyle('white-space:nowrap;')}">${esc(formatVnd(l.lineTotal))}</td></tr>`,
    )
    .join('');
  const sumRow = (label: string, value: string, strong = false) =>
    `<tr><td colspan="3" align="right" style="${cellStyle(strong ? `font-weight:bold;font-size:16px;border-top:2px solid ${C.foil500};` : '')}">${esc(label)}</td>` +
    `<td align="right" style="${cellStyle(`white-space:nowrap;${strong ? `font-weight:bold;font-size:16px;border-top:2px solid ${C.foil500};` : ''}`)}">${esc(value)}</td></tr>`;
  return (
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${C.ivory200};">` +
    head +
    lines +
    sumRow(t.shop.piecesTotal, formatVnd(order.pricing.pieces)) +
    sumRow(t.shop.boxLine(order.box.name), formatVnd(order.pricing.box)) +
    sumRow(t.shop.total, formatVnd(order.pricing.total), true) +
    `</table>`
  );
}

function cardBlock(order: OrderRecord): string {
  const { to, from, message } = order.card;
  const v = (s: string) => (s.trim() ? escMultiline(s) : esc(t.shop.cardEmpty));
  return (
    infoTable([infoRow(t.shop.cardTo, v(to)), infoRow(t.shop.cardFrom, v(from))]) +
    `<div style="font-family:${FONT};font-size:12px;color:${C.cacao600};padding:10px 0 4px;">${esc(t.shop.cardMessage)}</div>` +
    `<div style="font-family:${FONT};font-size:16px;line-height:1.6;color:${C.cacao900};background:${C.ivory100};border-left:4px solid ${C.foil500};padding:12px 14px;">${v(message)}</div>`
  );
}

const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`;

function customerRows(order: OrderRecord): string[] {
  const { customer, delivery } = order;
  const rows = [
    infoRow(t.shop.name, `<strong>${esc(customer.name)}</strong>`),
    infoRow(
      t.shop.phone,
      `<a href="${esc(telHref(customer.phone))}" style="color:${C.foil700};font-weight:bold;">${esc(customer.phone)}</a>`,
    ),
    infoRow(
      t.shop.email,
      customer.email
        ? `<a href="mailto:${esc(customer.email)}" style="color:${C.foil700};">${esc(customer.email)}</a>`
        : esc(t.shop.none),
    ),
    infoRow(t.shop.address, escMultiline(delivery.address)),
    infoRow(t.shop.province, esc(delivery.province)),
    infoRow(
      t.shop.desiredDate,
      delivery.desiredDate
        ? `<strong>${esc(formatIsoDate(delivery.desiredDate))}</strong>`
        : esc(t.shop.noDesiredDate),
    ),
    infoRow(t.shop.note, delivery.note ? escMultiline(delivery.note) : esc(t.shop.none)),
  ];
  return rows;
}

// ---- Email cho cửa hàng ------------------------------------------------------------------------

export function renderShopEmail(
  order: OrderRecord,
  opts: { trayCid?: string } = {},
): RenderedEmail {
  const cid = opts.trayCid ?? TRAY_CID;
  const subject = headerSafe(
    t.shop.subject(order.orderId, order.box.name, order.pricing.total, order.customer.name),
  );

  const overview = infoTable([
    infoRow(t.shop.time, esc(formatShopDateTime(order.createdAt))),
    infoRow(
      t.shop.desiredDate,
      order.delivery.desiredDate
        ? `<strong>${esc(formatIsoDate(order.delivery.desiredDate))}</strong>`
        : esc(t.shop.noDesiredDate),
    ),
    infoRow(t.shop.payment, esc(paymentLabel(order))),
    infoRow(t.shop.total, `<strong>${esc(formatVnd(order.pricing.total))}</strong>`),
  ]);

  const checklist =
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">` +
    t.shop.checklist
      .map(
        (item) =>
          `<tr><td valign="top" width="26" style="font-family:${FONT};font-size:16px;color:${C.foil700};padding:4px 0;">&#9744;</td>` +
          `<td style="font-family:${FONT};font-size:14px;line-height:1.5;color:${C.cacao900};padding:4px 0;">${esc(item)}</td></tr>`,
      )
      .join('') +
    `</table>`;

  const body =
    header(`${t.shop.heading} · ${order.box.name}`, order.orderId) +
    `<tr><td style="padding:20px 28px 0;">${overview}</td></tr>` +
    section(
      t.shop.trayHeading,
      trayImage(order, cid) +
        `<div style="font-family:${FONT};font-size:13px;line-height:1.5;color:${C.cacao600};padding-top:8px;">${esc(t.shop.trayCaption)}</div>`,
    ) +
    section(t.shop.cellsHeading, cellsTable(order)) +
    section(t.shop.summaryHeading, summaryTable(order)) +
    section(t.shop.cardHeading, cardBlock(order)) +
    section(t.shop.customerHeading, infoTable(customerRows(order))) +
    section(t.shop.checklistHeading, checklist) +
    `<tr><td style="padding:24px 28px;font-family:${FONT};font-size:12px;color:${C.cacao600};">${esc(t.brand)}</td></tr>`;

  return { subject, html: shell(subject, body), text: shopText(order) };
}

function shopText(order: OrderRecord): string {
  const L: string[] = [];
  const { delivery, customer, card } = order;
  L.push(`${t.shop.heading.toUpperCase()} ${order.orderId}`, '');
  L.push(`${t.shop.time}: ${formatShopDateTime(order.createdAt)}`);
  L.push(`${order.box.name} · ${formatVnd(order.pricing.total)} · ${paymentLabel(order)}`);
  L.push(
    `${t.shop.desiredDate}: ${delivery.desiredDate ? formatIsoDate(delivery.desiredDate) : t.shop.noDesiredDate}`,
    '',
  );
  L.push(
    `${t.shop.trayHeading.toUpperCase()}`,
    t.shop.trayCaption,
    `(${t.attachmentName(order.orderId)})`,
    '',
  );
  L.push(t.shop.cellsHeading.toUpperCase());
  for (const c of order.cells) L.push(`${t.shop.cellNumber} ${c.n}: ${c.name} (${c.id})`);
  L.push('', t.shop.summaryHeading.toUpperCase());
  for (const l of order.lines) {
    L.push(
      `${l.name} (${l.id}) x ${l.qty} · ${formatVnd(l.unitPrice)} = ${formatVnd(l.lineTotal)}`,
    );
  }
  L.push(`${t.shop.piecesTotal}: ${formatVnd(order.pricing.pieces)}`);
  L.push(`${order.box.name}: ${formatVnd(order.pricing.box)}`);
  L.push(`${t.shop.total}: ${formatVnd(order.pricing.total)}`);
  L.push(`${t.shop.payment}: ${paymentLabel(order)}`, '');
  L.push(t.shop.cardHeading.toUpperCase());
  L.push(
    `${t.shop.cardTo}: ${card.to || t.shop.cardEmpty}`,
    `${t.shop.cardFrom}: ${card.from || t.shop.cardEmpty}`,
  );
  L.push(`${t.shop.cardMessage}:`, card.message || t.shop.cardEmpty, '');
  L.push(t.shop.customerHeading.toUpperCase());
  L.push(`${t.shop.name}: ${customer.name}`, `${t.shop.phone}: ${customer.phone}`);
  L.push(`${t.shop.email}: ${customer.email ?? t.shop.none}`);
  L.push(`${t.shop.address}: ${delivery.address}`, `${t.shop.province}: ${delivery.province}`);
  L.push(`${t.shop.note}: ${delivery.note ?? t.shop.none}`, '');
  L.push(t.shop.checklistHeading.toUpperCase());
  for (const item of t.shop.checklist) L.push(`[ ] ${item}`);
  return L.join('\n');
}

// ---- Email xác nhận cho khách ------------------------------------------------------------------

export function renderCustomerEmail(
  order: OrderRecord,
  opts: { trayCid?: string } = {},
): RenderedEmail {
  const cid = opts.trayCid ?? TRAY_CID;
  const c = t.customer;
  const subject = headerSafe(c.subject(order.orderId));

  const lead =
    `<tr><td style="padding:24px 28px 0;">` +
    `<div style="font-family:${SERIF};font-size:20px;color:${C.cacao900};padding-bottom:8px;">${esc(c.greeting(order.customer.name))}</div>` +
    `<div style="font-family:${FONT};font-size:15px;line-height:1.6;color:${C.cacao900};">${esc(c.thanks)} <strong>${esc(c.next)}</strong></div>` +
    (order.payment === 'transfer'
      ? `<div style="font-family:${FONT};font-size:14px;line-height:1.6;color:${C.cacao600};padding-top:8px;">${esc(c.transferNote)}</div>`
      : '') +
    `</td></tr>`;

  const hasCard = order.card.message.trim() || order.card.to.trim() || order.card.from.trim();

  const body =
    header(c.heading, order.orderId) +
    lead +
    section(c.trayHeading, trayImage(order, cid)) +
    section(c.summaryHeading, summaryTable(order)) +
    (hasCard ? section(c.cardHeading, cardBlock(order)) : '') +
    section(
      c.deliveryHeading,
      infoTable([
        infoRow(t.shop.name, esc(order.customer.name)),
        infoRow(t.shop.address, escMultiline(order.delivery.address)),
        infoRow(t.shop.province, esc(order.delivery.province)),
        infoRow(
          t.shop.desiredDate,
          order.delivery.desiredDate
            ? esc(formatIsoDate(order.delivery.desiredDate))
            : esc(t.shop.noDesiredDate),
        ),
        infoRow(t.shop.payment, esc(paymentLabel(order))),
      ]),
    ) +
    `<tr><td style="padding:24px 28px;font-family:${FONT};font-size:13px;line-height:1.6;color:${C.cacao600};">${esc(c.replyHint)}<br>${esc(t.brand)}</td></tr>`;

  return { subject, html: shell(subject, body), text: customerText(order) };
}

function customerText(order: OrderRecord): string {
  const c = t.customer;
  const L: string[] = [c.greeting(order.customer.name), '', c.thanks, c.next];
  if (order.payment === 'transfer') L.push(c.transferNote);
  L.push('', `${t.shop.orderId}: ${order.orderId}`, '', c.summaryHeading.toUpperCase());
  for (const l of order.lines) L.push(`${l.name} x ${l.qty} = ${formatVnd(l.lineTotal)}`);
  L.push(`${order.box.name}: ${formatVnd(order.pricing.box)}`);
  L.push(`${t.shop.total}: ${formatVnd(order.pricing.total)}`);
  L.push(`${t.shop.payment}: ${paymentLabel(order)}`, '');
  L.push(
    c.deliveryHeading.toUpperCase(),
    `${order.customer.name}`,
    order.delivery.address,
    order.delivery.province,
  );
  if (order.delivery.desiredDate) {
    L.push(`${t.shop.desiredDate}: ${formatIsoDate(order.delivery.desiredDate)}`);
  }
  if (order.card.message.trim() || order.card.to.trim() || order.card.from.trim()) {
    L.push('', c.cardHeading.toUpperCase());
    L.push(
      `${t.shop.cardTo}: ${order.card.to || t.shop.cardEmpty}`,
      `${t.shop.cardFrom}: ${order.card.from || t.shop.cardEmpty}`,
      order.card.message,
    );
  }
  L.push('', c.replyHint, t.brand);
  return L.join('\n');
}
