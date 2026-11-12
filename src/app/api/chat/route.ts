import { handleChatRequest } from '@/lib/chat/handle-chat';

// Cần Node.js (SDK Anthropic, đọc catalog bằng fs), không chạy ở Edge, không cache.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(req: Request): Promise<Response> {
  return handleChatRequest(req);
}
