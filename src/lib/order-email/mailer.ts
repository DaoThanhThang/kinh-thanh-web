import { mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { orderEmail } from '@/content/order-email';
import type { OrderRecord } from '@/lib/order-server/types';
import { headerSafe } from './html';
import { renderCustomerEmail, renderShopEmail, TRAY_CID, type RenderedEmail } from './render';

export const DEFAULT_SHOP_EMAIL = 'abc@gmail.com';

export type MailConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  /** Địa chỉ gửi (không kèm tên hiển thị). */
  from: string;
  shopEmail: string;
};

type Env = Record<string, string | undefined>;

const EMAIL_IN_ANGLE = /<([^<>]+)>/;

/** Chấp nhận cả `a@b.com` lẫn `Tên <a@b.com>`; trả về địa chỉ thuần, đã bỏ CR/LF. */
function bareAddress(value: string): string {
  const v = headerSafe(value);
  return (EMAIL_IN_ANGLE.exec(v)?.[1] ?? v).trim();
}

/** Đọc cấu hình SMTP từ biến môi trường. Thiếu SMTP_HOST/USER/PASS → null (chế độ xem trước). */
export function readMailConfig(env: Env = process.env): MailConfig | null {
  const host = env.SMTP_HOST?.trim();
  const user = env.SMTP_USER?.trim();
  const pass = env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  const port = Number(env.SMTP_PORT) || 465;
  const secureRaw = env.SMTP_SECURE?.trim().toLowerCase();
  const secure = secureRaw ? ['true', '1', 'yes'].includes(secureRaw) : port === 465;
  return {
    host,
    port,
    secure,
    user,
    pass,
    from: bareAddress(env.MAIL_FROM?.trim() || user),
    shopEmail: bareAddress(env.SHOP_ORDER_EMAIL?.trim() || DEFAULT_SHOP_EMAIL),
  };
}

export type SendResult = { mode: 'sent' } | { mode: 'preview'; dir: string; files: string[] };

export type SendDeps = {
  env?: Env;
  /** Tiêm transport khi test. */
  createTransport?: (config: MailConfig) => Pick<Transporter, 'sendMail'>;
  previewDir?: string;
  log?: (...args: unknown[]) => void;
};

function defaultTransport(config: MailConfig): Transporter {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
    // Hàm serverless có thời gian chạy giới hạn: không để SMTP treo vô hạn.
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
}

const fromHeader = (address: string) => ({ name: orderEmail.brand, address });

/**
 * Gửi email đơn cho cửa hàng (bắt buộc) và xác nhận cho khách (nếu có email).
 * - Gửi email cho cửa hàng lỗi → ném lỗi (khách được báo thử lại).
 * - Gửi email cho khách lỗi → chỉ ghi log, đơn vẫn thành công.
 * - Chưa cấu hình SMTP: chế độ xem trước, ghi HTML + PNG ra thư mục tạm, không gửi gì. Trên Vercel
 *   (biến VERCEL có giá trị) thì từ chối thay vì giả vờ thành công để khỏi mất đơn trong im lặng (D58).
 */
export async function sendOrderEmails(
  order: OrderRecord,
  tray: Buffer,
  deps: SendDeps = {},
): Promise<SendResult> {
  const env = deps.env ?? process.env;
  const log = deps.log ?? ((...a: unknown[]) => console.log(...a));
  const config = readMailConfig(env);
  const shop = renderShopEmail(order);
  const customer = order.customer.email ? renderCustomerEmail(order) : null;

  if (!config) {
    if (env.VERCEL) {
      throw new Error('SMTP chưa được cấu hình (thiếu SMTP_HOST, SMTP_USER hoặc SMTP_PASS).');
    }
    return writePreview(order, tray, shop, customer, deps.previewDir, log);
  }

  const transport = (deps.createTransport ?? defaultTransport)(config);
  const attachments = [
    {
      filename: orderEmail.attachmentName(order.orderId),
      content: tray,
      contentType: 'image/png',
      cid: TRAY_CID,
    },
  ];

  await transport.sendMail({
    from: fromHeader(config.from),
    to: config.shopEmail,
    // Cửa hàng bấm "trả lời" là tới thẳng khách (nếu khách có email).
    ...(order.customer.email ? { replyTo: headerSafe(order.customer.email) } : {}),
    subject: shop.subject,
    html: shop.html,
    text: shop.text,
    attachments,
  });

  if (customer && order.customer.email) {
    try {
      await transport.sendMail({
        from: fromHeader(config.from),
        to: headerSafe(order.customer.email),
        replyTo: config.shopEmail,
        subject: customer.subject,
        html: customer.html,
        text: customer.text,
        attachments,
      });
    } catch (err) {
      log('[order-email] gửi xác nhận cho khách lỗi (đơn vẫn nhận):', order.orderId, err);
    }
  }
  return { mode: 'sent' };
}

async function writePreview(
  order: OrderRecord,
  tray: Buffer,
  shop: RenderedEmail,
  customer: RenderedEmail | null,
  previewDir: string | undefined,
  log: (...args: unknown[]) => void,
): Promise<SendResult> {
  const dir = previewDir ?? path.join(os.tmpdir(), 'kinh-thanh-mail');
  await mkdir(dir, { recursive: true });
  const png = orderEmail.attachmentName(order.orderId);
  // Mở trực tiếp bằng trình duyệt: thay cid: bằng đường dẫn tới file PNG cạnh nó.
  const viewable = (html: string) => html.split(`cid:${TRAY_CID}`).join(png);
  const files: string[] = [];
  const write = async (name: string, data: string | Buffer) => {
    const file = path.join(dir, name);
    await writeFile(file, data);
    files.push(file);
  };
  await write(png, tray);
  await write(`${order.orderId}-shop.html`, viewable(shop.html));
  await write(`${order.orderId}-shop.txt`, shop.text);
  if (customer) {
    await write(`${order.orderId}-customer.html`, viewable(customer.html));
    await write(`${order.orderId}-customer.txt`, customer.text);
  }
  log(`[order-email] chưa cấu hình SMTP, chế độ xem trước. Đã ghi email và ảnh khay vào ${dir}`);
  return { mode: 'preview', dir, files };
}
