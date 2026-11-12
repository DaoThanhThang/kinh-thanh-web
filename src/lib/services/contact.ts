import type { ContactMessage } from '@/lib/schemas/contact';

export type ContactResult = { ok: true } | { ok: false; error: string };

/** Cổng gửi lời nhắn liên hệ. UI chỉ biết interface này (cùng kiểu với OrderService). */
export interface ContactService {
  sendMessage(message: ContactMessage): Promise<ContactResult>;
}

export type MockContactOptions = {
  delayMs?: number;
  /** Mặc định console.info: lời nhắn chỉ ở trong console, không gửi đi đâu. */
  log?: (...args: unknown[]) => void;
};

/** Giả lập: chờ 700ms, ghi ra console, báo thành công. Không gọi mạng. */
export class MockContactService implements ContactService {
  private readonly opts: Required<MockContactOptions>;

  constructor(opts: MockContactOptions = {}) {
    this.opts = {
      delayMs: opts.delayMs ?? 700,
      log: opts.log ?? ((...args) => console.info(...args)),
    };
  }

  async sendMessage(message: ContactMessage): Promise<ContactResult> {
    await new Promise((resolve) => setTimeout(resolve, this.opts.delayMs));
    this.opts.log('[MockContactService] lời nhắn liên hệ (chỉ ghi ra console)', message);
    return { ok: true };
  }
}

/** Dùng ở client. Chưa có backend nên luôn là mock; đổi nguồn ở đây khi có (T16). */
export function getContactService(): ContactService {
  return new MockContactService();
}
