import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const QUORUM_REQUIRED = 2;

/**
 * validateLegacyRelease — single source of truth for release authorization.
 * Returns true ONLY if ALL conditions are met:
 *   1. Protocol status = approved_for_release
 *   2. 2+ verified contacts confirmed
 *   3. Verified executor approved
 *   4. Cooling-off expired
 *   5. No pause
 *   6. No cancellation
 *   7. No recent user activity
 *
 * Every release must call this function before releasing any content.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { protocol_id, user_id } = body;

    if (!protocol_id || !user_id) {
      return Response.json({ valid: false, reasons: ['Missing protocol_id or user_id'] }, { status: 400 });
    }

    // Fetch protocol
    const protocols = await base44.asServiceRole.entities.LegacyProtocol.filter({ id: protocol_id });
    const protocol = protocols[0];
    if (!protocol) {
      return Response.json({ valid: false, reasons: ['Protocol not found'] }, { status: 404 });
    }

    // Fetch user
    const users = await base44.asServiceRole.entities.User.list();
    const user = users.find(u => u.id === user_id);
    if (!user) {
      return Response.json({ valid: false, reasons: ['User not found'] }, { status: 404 });
    }

    const now = new Date();
    const reasons = [];

    // 1. Protocol status must be approved_for_release
    if (protocol.status !== 'approved_for_release') {
      reasons.push(`Protocol status is "${protocol.status}", must be "approved_for_release"`);
    }

    // 2. 2+ verified contacts confirmed
    const confirmedCount = protocol.contact_confirmation_count || 0;
    if (confirmedCount < QUORUM_REQUIRED) {
      reasons.push(`Only ${confirmedCount}/${QUORUM_REQUIRED} contact confirmations`);
    }

    // Verify the confirming contacts are still verified
    const verifiedContacts = await base44.asServiceRole.entities.TrustedContact.filter({
      created_by_id: user_id,
      verification_status: 'verified',
    });
    const confirmedByIds = user.legacy_confirmed_by_ids || [];
    for (const contactId of confirmedByIds) {
      const stillVerified = verifiedContacts.find(c => c.id === contactId);
      if (!stillVerified) {
        reasons.push(`Contact ${contactId} is no longer verified — confirmation invalid`);
      }
    }

    // 3. Verified executor approved — check multiple conditions, not just a boolean flag
    if (!protocol.executor_approved) {
      reasons.push('Executor has not approved (protocol.executor_approved is false)');
    }

    const executors = await base44.asServiceRole.entities.Executor.filter({
      user_id: user_id,
      verification_status: 'verified',
    });
    if (executors.length === 0) {
      reasons.push('No verified executor exists');
    }

    // Check ExecutorApprovalRequest — do not rely on a single boolean flag
    if (protocol.executor_approval_request_id) {
      const approvalRequests = await base44.asServiceRole.entities.ExecutorApprovalRequest.filter({
        id: protocol.executor_approval_request_id,
      });
      const approvalRequest = approvalRequests[0];
      if (!approvalRequest) {
        reasons.push('ExecutorApprovalRequest not found');
      } else {
        if (approvalRequest.status !== 'approved') {
          reasons.push(`ExecutorApprovalRequest status is "${approvalRequest.status}", must be "approved"`);
        }
        if (!approvalRequest.completed_date) {
          reasons.push('ExecutorApprovalRequest has no completed_date — approval not finalized');
        }
      }
    } else {
      reasons.push('No ExecutorApprovalRequest linked to protocol');
    }

    // 4. Cooling-off expired
    if (protocol.cooling_off_ends_date) {
      const coolingOffEnd = new Date(protocol.cooling_off_ends_date);
      if (now < coolingOffEnd) {
        reasons.push(`Cooling-off period not expired until ${coolingOffEnd.toISOString()}`);
      }
    } else {
      reasons.push('No cooling-off period was set');
    }

    // 5. No pause
    if (protocol.status === 'paused' || protocol.paused_date) {
      reasons.push('Protocol is paused');
    }

    // 6. No cancellation
    if (protocol.cancelled_date || ['cancelled', 'cancelled_by_user_activity'].includes(protocol.status)) {
      reasons.push('Protocol is cancelled');
    }

    // 7. No recent user activity
    const activityDate = user.legacy_activity_timestamp || user.last_checkin_date;
    if (activityDate) {
      const lastActivity = new Date(activityDate);
      const waitMonths = user.legacy_wait_months || 3;
      const threshold = new Date(lastActivity);
      threshold.setMonth(threshold.getMonth() + waitMonths);
      if (now < threshold) {
        reasons.push(`User was recently active (${activityDate}) — protocol should have been cancelled`);
      }
    }

    const valid = reasons.length === 0;

    // Audit the validation result
    try {
      await base44.asServiceRole.entities.LegacyAuditLog.create({
        user_id: user_id,
        event_type: valid ? 'release_validation_passed' : 'release_validation_failed',
        details: `Validation ${valid ? 'PASSED' : 'FAILED'}. ${reasons.length} reason(s): ${reasons.join('; ') || 'none'}`,
      });
    } catch (e) {
      console.error('Failed to log validation:', e.message);
    }

    return Response.json({
      valid,
      reasons,
      checked_at: now.toISOString(),
    });
  } catch (error) {
    console.error('validateLegacyRelease error:', error);
    return Response.json({ valid: false, reasons: ['Internal error: ' + error.message] }, { status: 500 });
  }
});