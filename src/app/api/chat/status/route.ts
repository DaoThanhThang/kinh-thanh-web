import { chatStatus } from '@/lib/chat/handle-chat';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  const { enabled, mode } = chatStatus();
  return Response.json({ enabled, mode }, { headers: { 'Cache-Control': 'no-store' } });
}
