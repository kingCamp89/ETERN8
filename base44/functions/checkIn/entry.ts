import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Manual check-in — "I'm alive" button.
 * Like autoCheckIn, this FULLY cancels any active legacy protocol.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date().toISOString();
    const updates = {
      last_checkin_date: now,
      legacy_activity_timestamp: now,
    };

    // Full cancel if protocol was active
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

      const protocols = await base44.asServiceRole.entities.LegacyProtocol.filter({ user_id: user.id });
      const activeProtocols = protocols.filter(p =>
        !['released', 'cancelled', 'cancelled_by_user_activity'].includes(p.status)
      );
      for (const protocol of activeProtocols) {
        await base44.asServiceRole.entities.LegacyProtocol.update(protocol.id, {
          status: 'cancelled_by_user_activity',
          cancelled_date: now,
          cancelled_reason: 'Manual check-in — user confirmed they are okay',
        });
      }

      await base44.asServiceRole.entities.LegacyAuditLog.create({
        user_id: user.id,
        event_type: 'manual_check_in',
        details: 'Manual check-in. Active legacy protocol fully cancelled.',
      });
    }

    await base44.auth.updateMe(updates);

    return Response.json({
      success: true,
      checked_in_at: now,
      protocol_cancelled: wasTriggered || wasActiveProtocol,
    });
  } catch (_error) {
    return Response.json({ error: 'Could not check in' }, { status: 500 });
  }
});