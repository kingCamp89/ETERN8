import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

async function hashToken(token) {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verifies a trusted contact via secure single-use token.
 * Only after verification can a contact confirm death or receive legacy content.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { contactId, token } = await req.json();

    if (!contactId || !token) {
      return Response.json({ error: 'Missing contact ID or token' }, { status: 400 });
    }

    const contacts = await base44.asServiceRole.entities.TrustedContact.filter({ id: contactId });
    const contact = contacts[0];
    if (!contact) {
      return Response.json({ error: 'Contact not found' }, { status: 404 });
    }

    if (contact.verification_status === 'verified') {
      return Response.json({ success: true, message: 'Contact already verified', already_verified: true });
    }

    // Verify token hash with rate limiting
    const tokenHash = await hashToken(token);
    if (!contact.verification_token_hash || contact.verification_token_hash !== tokenHash) {
      const failedCount = (contact.failed_attempt_count || 0) + 1;
      const shouldExpire = failedCount >= 5;

      await base44.asServiceRole.entities.TrustedContact.update(contactId, {
        failed_attempt_count: failedCount,
        last_failed_attempt_at: new Date().toISOString(),
        ...(shouldExpire ? {
          verification_token_hash: null,
          verification_token_expires_at: null,
        } : {}),
      });

      if (shouldExpire) {
        await base44.asServiceRole.entities.LegacyAuditLog.create({
          user_id: contact.created_by_id,
          contact_id: contactId,
          event_type: 'rate_limit_exceeded',
          details: `Contact ${contact.name} exceeded 5 failed verification attempts. Token expired.`,
        });
        return Response.json({ error: 'Too many failed attempts. This link has been permanently disabled.' }, { status: 429 });
      }

      return Response.json({
        error: 'Invalid token',
        attempts_remaining: 5 - failedCount,
      }, { status: 403 });
    }

    // Check expiry
    if (contact.verification_token_expires_at && new Date() > new Date(contact.verification_token_expires_at)) {
      return Response.json({ error: 'This verification link has expired' }, { status: 403 });
    }

    // Mark as verified — invalidate token (single-use) and reset failed attempts
    const now = new Date().toISOString();
    await base44.asServiceRole.entities.TrustedContact.update(contactId, {
      verification_status: 'verified',
      is_verified: true,
      verified_at: now,
      verification_token_hash: null,
      verification_token_expires_at: null,
      failed_attempt_count: 0,
      last_failed_attempt_at: null,
    });

    // Audit log
    await base44.asServiceRole.entities.LegacyAuditLog.create({
      user_id: contact.created_by_id,
      contact_id: contactId,
      event_type: 'contact_verified',
      details: `Contact ${contact.name} verified their email at ${now}.`,
    });

    return Response.json({
      success: true,
      message: 'Email verified. You are now a verified trusted contact.',
    });
  } catch (error) {
    return Response.json({ error: 'Could not verify contact' }, { status: 500 });
  }
});