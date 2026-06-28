import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const TOKEN_EXPIRY_DAYS = 7;

async function hashToken(token) {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Adds a trusted contact with pending verification status.
 * Creates a secure single-use verification token and emails the contact.
 * Contacts start as PENDING — never verified.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, email, phone, relationship } = await req.json();
    if (!name || !email) {
      return Response.json({ error: 'Name and email are required' }, { status: 400 });
    }

    // Check for duplicate
    const existing = await base44.entities.TrustedContact.filter({
      created_by_id: user.id,
      email: email,
    });
    if (existing.length > 0) {
      return Response.json({ error: 'A contact with this email already exists' }, { status: 400 });
    }

    // Generate verification token
    const rawToken = crypto.randomUUID();
    const tokenHash = await hashToken(rawToken);
    const expiresAt = addDays(new Date(), TOKEN_EXPIRY_DAYS).toISOString();

    // Create contact with PENDING status
    const contact = await base44.asServiceRole.entities.TrustedContact.create({
      name,
      email,
      phone: phone || null,
      relationship: relationship || null,
      verification_status: 'pending',
      is_verified: false,
      verification_token_hash: tokenHash,
      verification_token_expires_at: expiresAt,
      created_by_id: user.id,
    });

    // Send verification email
    const origin = req.headers.get('origin') || 'https://app.base44.app';
    const verifyUrl = `${origin}/legacy-confirm?verify_contact=${contact.id}&token=${encodeURIComponent(rawToken)}`;

    const userName = user.full_name || 'your loved one';
    let emailSent = false;
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: email,
        subject: `${userName} has designated you as a trusted contact on ETERN8`,
        body: [
          `Dear ${name},`,
          '',
          `${userName} has designated you as a trusted contact on ETERN8.`,
          '',
          'As a trusted contact, you may be asked to verify their wellbeing in the future.',
          '',
          'To accept this role, please verify your email by clicking the link below:',
          '',
          verifyUrl,
          '',
          `This link expires in ${TOKEN_EXPIRY_DAYS} days and can only be used once.`,
          '',
          'If you do not wish to accept this role, you can simply ignore this email.',
          '',
          'With care,',
          'The ETERN8 Team',
        ].join('\n'),
      });
      emailSent = true;
    } catch (emailErr) {
      console.error('Failed to send verification email:', emailErr.message);
    }

    // Audit log
    try {
      await base44.asServiceRole.entities.LegacyAuditLog.create({
        user_id: user.id,
        contact_id: contact.id,
        event_type: 'contact_added',
        details: `Trusted contact ${name} (${email}) added with pending verification.`,
      });
      if (emailSent) {
        await base44.asServiceRole.entities.LegacyAuditLog.create({
          user_id: user.id,
          contact_id: contact.id,
          event_type: 'contact_verification_sent',
          details: `Verification email sent to ${name} (${email}). Token expires in ${TOKEN_EXPIRY_DAYS} days.`,
        });
      }
    } catch (logErr) {
      console.error('Failed to create audit log:', logErr.message);
    }

    return Response.json({
      success: true,
      contact_id: contact.id,
      message: emailSent ? 'Trusted contact added. Verification email sent.' : 'Trusted contact added. Verification email could not be sent — please resend.',
    });
  } catch (error) {
    console.error('addTrustedContact error:', error);
    return Response.json({ error: error.message || 'Could not add trusted contact' }, { status: 500 });
  }
});