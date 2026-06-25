import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

async function hashToken(token) {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verifies an executor via secure single-use token.
 * Only after verification can an executor approve, pause, or cancel release.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { executorId, token } = await req.json();

    if (!executorId || !token) {
      return Response.json({ error: 'Missing executor ID or token' }, { status: 400 });
    }

    const executors = await base44.asServiceRole.entities.Executor.filter({ id: executorId });
    const executor = executors[0];
    if (!executor) {
      return Response.json({ error: 'Executor not found' }, { status: 404 });
    }

    if (executor.verification_status === 'verified') {
      return Response.json({ success: true, message: 'Executor already verified', already_verified: true });
    }

    // Verify token hash with rate limiting
    const tokenHash = await hashToken(token);
    if (!executor.verification_token_hash || executor.verification_token_hash !== tokenHash) {
      const failedCount = (executor.failed_attempt_count || 0) + 1;
      const shouldExpire = failedCount >= 5;

      await base44.asServiceRole.entities.Executor.update(executorId, {
        failed_attempt_count: failedCount,
        last_failed_attempt_at: new Date().toISOString(),
        ...(shouldExpire ? {
          verification_token_hash: null,
          verification_token_expires_at: null,
        } : {}),
      });

      if (shouldExpire) {
        await base44.asServiceRole.entities.LegacyAuditLog.create({
          user_id: executor.user_id,
          contact_id: executorId,
          event_type: 'rate_limit_exceeded',
          details: `Executor ${executor.full_name} exceeded 5 failed verification attempts. Token expired.`,
        });
        return Response.json({ error: 'Too many failed attempts. This link has been permanently disabled.' }, { status: 429 });
      }

      return Response.json({
        error: 'Invalid token',
        attempts_remaining: 5 - failedCount,
      }, { status: 403 });
    }

    // Check expiry
    if (executor.verification_token_expires_at && new Date() > new Date(executor.verification_token_expires_at)) {
      return Response.json({ error: 'This verification link has expired' }, { status: 403 });
    }

    // Mark as verified — invalidate token (single-use) and reset failed attempts
    const now = new Date().toISOString();
    await base44.asServiceRole.entities.Executor.update(executorId, {
      verification_status: 'verified',
      verified_at: now,
      verification_token_hash: null,
      verification_token_expires_at: null,
      failed_attempt_count: 0,
      last_failed_attempt_at: null,
    });

    // Audit log
    await base44.asServiceRole.entities.LegacyAuditLog.create({
      user_id: executor.user_id,
      contact_id: executorId,
      event_type: 'executor_verified',
      details: `Executor ${executor.full_name} verified their email at ${now}.`,
    });

    return Response.json({
      success: true,
      message: 'Email verified. You are now a verified executor.',
    });
  } catch (error) {
    return Response.json({ error: 'Could not verify executor' }, { status: 500 });
  }
});