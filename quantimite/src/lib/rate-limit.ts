// In-memory rate limiter. Swap with Redis (Upstash) for multi-instance deployments.
// Keyed by an identifier (IP, userId, etc.) and a bucket name.

type Bucket = { count: number; resetAt: number };
const store = new Map<string, Bucket>();

export interface RateLimitOptions {
  key: string;
  bucket?: string;
  limit: number;
  windowMs: number;
}

export function rateLimit({ key, bucket = "default", limit, windowMs }: RateLimitOptions) {
  const composite = `${bucket}:${key}`;
  const now = Date.now();
  const existing = store.get(composite);

  if (!existing || existing.resetAt < now) {
    store.set(composite, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, resetAt: now + windowMs };
  }
  if (existing.count >= limit) {
    return { ok: false, remaining: 0, resetAt: existing.resetAt };
  }
  existing.count += 1;
  return { ok: true, remaining: limit - existing.count, resetAt: existing.resetAt };
}

// Periodically prune to avoid memory growth.
if (typeof setInterval !== "undefined") {
  const prune = () => {
    const now = Date.now();
    for (const [k, v] of store) if (v.resetAt < now) store.delete(k);
  };
  setInterval(prune, 60_000).unref?.();
}