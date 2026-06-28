const INTERNAL_HEADER = 'x-internal-secret';

export function getInternalSecret(): string | undefined {
  return Deno.env.get('INTERNAL_FUNCTION_SECRET') ?? Deno.env.get('CRON_SECRET');
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) {
    out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return out === 0;
}

export function extractProvidedSecret(
  req: Request,
  body?: Record<string, unknown>,
): string | null {
  const dedicated = req.headers.get(INTERNAL_HEADER);
  if (dedicated) return dedicated;

  const authorization = req.headers.get('authorization');
  if (authorization?.startsWith('Bearer ')) {
    return authorization.slice(7);
  }

  const fromBody = body?._internalSecret;
  return typeof fromBody === 'string' ? fromBody : null;
}

/** Returns a 401/503 Response when unauthorized, or null when the caller may proceed. */
export function requireInternalSecret(
  req: Request,
  body?: Record<string, unknown>,
): Response | null {
  const expected = getInternalSecret();
  if (!expected) {
    console.error('INTERNAL_FUNCTION_SECRET or CRON_SECRET is not configured');
    return Response.json({ error: 'Service misconfigured' }, { status: 503 });
  }

  const provided = extractProvidedSecret(req, body);
  if (!provided || !safeEqual(provided, expected)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return null;
}

export function internalPayload<T extends Record<string, unknown>>(
  payload: T,
): T & { _internalSecret: string } {
  const secret = getInternalSecret();
  if (!secret) {
    throw new Error('INTERNAL_FUNCTION_SECRET or CRON_SECRET is not configured');
  }
  return { ...payload, _internalSecret: secret };
}

export function stripInternalSecret<T extends Record<string, unknown>>(body: T): Omit<T, '_internalSecret'> {
  const { _internalSecret: _ignored, ...rest } = body;
  return rest;
}
