import { handleOrderRequest } from '@/lib/order-server/handle-order';

// Cần Node.js (nodemailer, resvg dùng module gốc), không chạy ở Edge, không cache.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Dựng ảnh khay + gửi SMTP có thể mất vài giây.
export const maxDuration = 30;

export async function POST(req: Request): Promise<Response> {
  return handleOrderRequest(req);
}
