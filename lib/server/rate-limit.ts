export interface RateLimitResult {
  ok: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds?: number;
}

const buckets = new Map<
  string,
  { count: number; resetAt: number; limit: number; windowMs: number }
>();

function nowMs(): number {
  return Date.now();
}

export function rateLimit(
  key: string,
  opts: { limit: number; windowMs: number }
): RateLimitResult {
  const now = nowMs();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now || existing.limit !== opts.limit || existing.windowMs !== opts.windowMs) {
    const resetAt = now + opts.windowMs;
    buckets.set(key, { count: 1, resetAt, limit: opts.limit, windowMs: opts.windowMs });
    return { ok: true, limit: opts.limit, remaining: opts.limit - 1, resetAt };
  }

  if (existing.count >= existing.limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    return {
      ok: false,
      limit: existing.limit,
      remaining: 0,
      resetAt: existing.resetAt,
      retryAfterSeconds,
    };
  }

  existing.count += 1;
  buckets.set(key, existing);

  return {
    ok: true,
    limit: existing.limit,
    remaining: Math.max(0, existing.limit - existing.count),
    resetAt: existing.resetAt,
  };
}

export function buildRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.floor(result.resetAt / 1000)),
    ...(result.ok
      ? {}
      : {
          'Retry-After': String(result.retryAfterSeconds || 60),
        }),
  };
}

