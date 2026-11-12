/**
 * Giới hạn tần suất theo khoá (IP) bằng bộ nhớ tiến trình.
 *
 * Lưu ý: trên Vercel (serverless) mỗi instance có bộ nhớ riêng và có thể bị thu hồi bất kỳ lúc nào,
 * nên đây chỉ là biện pháp răn đe đủ dùng cho cửa hàng nhỏ, không phải hàng rào tuyệt đối.
 * Nâng cấp: Vercel KV / Upstash Redis (INCR + EXPIRE theo IP) với cùng interface `check`.
 */
export type RateLimiter = {
  check(key: string): { allowed: boolean; retryAfterSec: number };
  reset(): void;
};

export function createRateLimiter(opts: {
  max: number;
  windowMs: number;
  maxKeys?: number;
  now?: () => number;
}): RateLimiter {
  const { max, windowMs, maxKeys = 5000, now = Date.now } = opts;
  const hits = new Map<string, number[]>();

  const prune = (t: number) => {
    for (const [k, list] of hits) {
      if (list.every((x) => t - x >= windowMs)) hits.delete(k);
    }
    // Vẫn quá nhiều khoá: bỏ khoá cũ nhất (Map giữ thứ tự chèn).
    for (const k of hits.keys()) {
      if (hits.size <= maxKeys) break;
      hits.delete(k);
    }
  };

  return {
    check(key) {
      const t = now();
      const recent = (hits.get(key) ?? []).filter((x) => t - x < windowMs);
      if (recent.length >= max) {
        hits.set(key, recent);
        const oldest = recent[0] ?? t;
        return {
          allowed: false,
          retryAfterSec: Math.max(1, Math.ceil((oldest + windowMs - t) / 1000)),
        };
      }
      recent.push(t);
      hits.delete(key); // đưa khoá lên cuối thứ tự chèn
      hits.set(key, recent);
      if (hits.size > maxKeys) prune(t);
      return { allowed: true, retryAfterSec: 0 };
    },
    reset() {
      hits.clear();
    },
  };
}
