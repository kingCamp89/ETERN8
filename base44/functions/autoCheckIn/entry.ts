import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Auto check-in — called on every authenticated activity.
 * CRITICAL SAFETY: Fully cancels any active legacy protocol, not just timestamps.
 * This prevents false posthumous release when a living user simply uses the app.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ success: false, reason: 'unauthenticated' });
    }

    const now = new Date().toISOString();

    // Always update timestamps
    const updates = {
      last_checkin_date: now,
      legacy_activity_timestamp: now,
    };

    // If legacy was triggered or protocol is active, FULLY CANCEL everything
    const wasTriggered = user.legacy_triggered === true;
    const activeStatuses = ['verification_pending', 'executor_review', 'approved_for_release'];
    const wasActiveProtocol = activeStatuses.includes(user.legacy_protocol_status);

    if (wasTriggered || wasActiveProtocol) {
      updates.legacy_triggered = false;
      updates.legacy_confirmations = 0;
      updates.legacy_confirmed_by_ids = [];
      updates.legacy_cooling_off_until = null;
      updates.legacy_notification_count = 0;
      updates.legacy_last_notification_at = null;
      updates.legacy_confirm_tokens = [];
      updates.legacy_protocol_status = 'cancelled_by_user_activity';

      // Cancel active LegacyProtocol records
      const protocols = await base44.asServiceRole.entities.LegacyProtocol.filter({
        user_id: user.id,
      });
      const activeProtocols = protocols.filter(p =>
        !['released', 'cancelled', 'cancelled_by_user_activity'].includes(p.status)
      );
      for (const protocol of activeProtocols) {
        await base44.asServiceRole.entities.LegacyProtocol.update(protocol.id, {
          status: 'cancelled_by_user_activity',
          cancelled_date: now,
          cancelled_reason: 'User activity detected — auto check-in cancelled the protocol',
        });
      }

      // Invalidate all pending confirmation tokens on trusted contacts
      const contacts = await base44.asServiceRole.entities.TrustedContact.filter({
        created_by_id: user.id,
      });
      for (const contact of contacts) {
        if (contact.verification_token_hash) {
          await base44.asServiceRole.entities.TrustedContact.update(contact.id, {
            verification_token_hash: null,
            verification_token_expires_at: null,
          });
        }
      }

      // Log the cancellation
      await base44.asServiceRole.entities.LegacyAuditLog.create({
        user_id: user.id,
        event_type: 'auto_check_in',
        details: 'User activity detected. Active legacy protocol fully cancelled — all confirmations cleared, tokens invalidated, protocol set to cancelled_by_user_activity.',
      });

      // Notify verified trusted contacts and executor that the process was cancelled
      const verifiedContacts = contacts.filter(c => c.verification_status === 'verified');
      const executors = await base44.asServiceRole.entities.Executor.filter({
        user_id: user.id,
        verification_status: 'verified',
      });

      const userName = user.full_name || 'your loved one';
      const cancelMsg = [
        `Dear trusted contact,`,
        '',
        `Good news — ${userName} has been active on ETRN8.`,
        '',
        'The legacy verification process has been cancelled.',
        'No further action is required from you at this time.',
        '',
        'With care,',
        'The ETRN8 Team',
      ].join('\n');

      for (const contact of verifiedContacts) {
        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: contact.email,
            subject: `Update: ${userName} is active — process cancelled`,
            body: cancelMsg,
          });
        } catch (e) {
          console.error('Failed to notify contact:', e.message);
        }
      }

      for (const executor of executors) {
        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: executor.email,
            subject: `Update: ${userName} is active — legacy process cancelled`,
            body: [
              `Dear ${executor.full_name},`,
              '',
              `Good news — ${userName} has been active on ETRN8.`,
              '',
              'The legacy verification process has been cancelled.',
              'No further action is required from you at this time.',
              '',
              'With care,',
              'The ETRN8 Team',
            ].join('\n'),
          });
        } catch (e) {
          console.error('Failed to notify executor:', e.message);
        }
      }
    }

    await base44.auth.updateMe(updates);

    return Response.json({
      success: true,
      checked_in_at: now,
      protocol_cancelled: wasTriggered || wasActiveProtocol,
    });
  } catch (_error) {
    return Response.json({ success: false }, { status: 500 });
  }
});