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
 * Adds an executor with pending verification status.
 * Creates a secure single-use verification token and emails the executor.
 * Executors must verify before they can approve, pause, or cancel.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { full_name, email, phone, relationship, role } = await req.json();
    if (!full_name || !email) {
      return Response.json({ error: 'Full name and email are required' }, { status: 400 });
    }

    // Check for duplicate
    const existing = await base44.entities.Executor.filter({
      user_id: user.id,
      email: email,
    });
    if (existing.length > 0) {
      return Response.json({ error: 'An executor with this email already exists' }, { status: 400 });
    }

    // Generate verification token
    const rawToken = crypto.randomUUID();
    const tokenHash = await hashToken(rawToken);
    const expiresAt = addDays(new Date(), TOKEN_EXPIRY_DAYS).toISOString();

    // Create executor with PENDING status
    const executor = await base44.asServiceRole.entities.Executor.create({
      user_id: user.id,
      full_name,
      email,
      phone: phone || null,
      relationship: relationship || null,
      role: role || 'primary',
      verification_status: 'pending',
      can_approve_release: true,
      can_pause_release: true,
      can_cancel_release: true,
      verification_token_hash: tokenHash,
      verification_token_expires_at: expiresAt,
    });

    // Send verification email
    const origin = req.headers.get('origin') || 'https://app.base44.app';
    const verifyUrl = `${origin}/legacy-confirm?verify_executor=${executor.id}&token=${encodeURIComponent(rawToken)}`;

    const userName = user.full_name || 'your loved one';
    let emailSent = false;
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: email,
        subject: `${userName} has designated you as their legacy executor on ETERN8`,
        body: [
          `Dear ${full_name},`,
          '',
          `${userName} has designated you as their legacy executor on ETERN8.`,
          '',
          'As an executor, you will be the final safeguard before any legacy memories are released.',
          'You may be asked to approve, pause, or cancel the release process.',
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
        contact_id: executor.id,
        event_type: 'executor_added',
        details: `Executor ${full_name} (${email}) added with pending verification. Role: ${role || 'primary'}.`,
      });
      if (emailSent) {
        await base44.asServiceRole.entities.LegacyAuditLog.create({
          user_id: user.id,
          contact_id: executor.id,
          event_type: 'executor_verification_sent',
          details: `Verification email sent to ${full_name} (${email}). Token expires in ${TOKEN_EXPIRY_DAYS} days.`,
        });
      }
    } catch (logErr) {
      console.error('Failed to create audit log:', logErr.message);
    }

    return Response.json({
      success: true,
      executor_id: executor.id,
      message: emailSent ? 'Executor added. Verification email sent.' : 'Executor added. Verification email could not be sent — please resend.',
    });
  } catch (error) {
    console.error('addExecutor error:', error);
    return Response.json({ error: error.message || 'Could not add executor' }, { status: 500 });
  }
});