import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const COOLING_OFF_DAYS = 14;
const QUORUM_REQUIRED = 2;
const TOKEN_EXPIRY_DAYS = 7;
const MAX_FAILED_ATTEMPTS = 5;

async function hashToken(token) {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function logEvent(base44, userId, contactId, eventType, details) {
  try {
    await base44.asServiceRole.entities.LegacyAuditLog.create({
      user_id: userId,
      contact_id: contactId || null,
      event_type: eventType,
      details,
    });
  } catch (e) {
    console.error('Failed to log event:', e.message);
  }
}

async function sendEmail(base44, to, subject, body) {
  try {
    await base44.asServiceRole.integrations.Core.SendEmail({ to, subject, body });
  } catch (e) {
    console.error('Failed to email:', to, e.message);
  }
}

/**
 * Handles trusted contact confirmation link clicks and executor approval actions.
 *
 * EXECUTOR ACTIONS use ExecutorApprovalRequest — completely separate from
 * identity verification tokens. Verification proves identity; approval authorizes release.
 *
 * Actions:
 *   Contact: mark_alive, confirm_passed, not_sure, report_mistake, pause
 *   Executor: executor_approve, executor_pause, executor_cancel, report_mistake (executor)
 *
 * Rate limiting: After MAX_FAILED_ATTEMPTS failed token validations, the token is
 * expired and the link becomes permanently invalid.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { userId, contactId, executorId, approvalId, token, action } = body;

    if (!userId || !token || !action) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const validActions = [
      'mark_alive', 'confirm_passed', 'not_sure', 'report_mistake', 'pause',
      'executor_approve', 'executor_pause', 'executor_cancel'
    ];
    if (!validActions.includes(action)) {
      return Response.json({ error: 'Invalid action' }, { status: 400 });
    }

    const isExecutorAction = action.startsWith('executor_') || (action === 'report_mistake' && executorId);

    // Get the user
    const users = await base44.asServiceRole.entities.User.list();
    const user = users.find(u => u.id === userId);
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Get active protocol
    const protocols = await base44.asServiceRole.entities.LegacyProtocol.filter({ user_id: userId });
    const protocol = protocols.find(p =>
      !['released', 'cancelled', 'cancelled_by_user_activity'].includes(p.status)
    );

    const now = new Date();

    // ═══════════════════════════════════════════════════════════════
    // EXECUTOR ACTIONS — uses ExecutorApprovalRequest (NOT verification tokens)
    // Verification proves identity. Approval authorizes release.
    // These are completely separate systems.
    // ═══════════════════════════════════════════════════════════════
    if (isExecutorAction) {
      if (!executorId) {
        return Response.json({ error: 'Executor ID required' }, { status: 400 });
      }

      // Find the executor
      const executors = await base44.asServiceRole.entities.Executor.filter({
        id: executorId,
        user_id: userId,
      });
      const executor = executors[0];
      if (!executor) {
        return Response.json({ error: 'Executor not found' }, { status: 404 });
      }

      // Executor must be identity-verified (verification_status, NOT approval token)
      if (executor.verification_status !== 'verified') {
        await logEvent(base44, userId, executorId, 'access_denied',
          `Unverified executor ${executor.full_name} attempted action ${action}`);
        return Response.json({ error: 'Executor must be verified before acting' }, { status: 403 });
      }

      // ── Find the active ExecutorApprovalRequest ──
      // Do NOT use Executor.verification_token_hash for approval actions
      let approvalRequest = null;

      if (approvalId) {
        // Find by approval request ID
        const requests = await base44.asServiceRole.entities.ExecutorApprovalRequest.filter({
          id: approvalId,
          executor_id: executorId,
          user_id: userId,
        });
        approvalRequest = requests[0];
      } else {
        // Find any pending approval request for this executor
        const requests = await base44.asServiceRole.entities.ExecutorApprovalRequest.filter({
          executor_id: executorId,
          user_id: userId,
          status: 'pending',
        });
        approvalRequest = requests[0];
      }

      if (!approvalRequest) {
        await logEvent(base44, userId, executorId, 'access_denied',
          `No active approval request found for executor ${executor.full_name}`);
        return Response.json({ error: 'No active approval request found' }, { status: 404 });
      }

      // Validate approval request status
      if (approvalRequest.status !== 'pending') {
        await logEvent(base44, userId, executorId, 'access_denied',
          `Approval request ${approvalRequest.id} is not pending (status: ${approvalRequest.status})`);
        return Response.json({ error: 'This approval request has already been completed' }, { status: 403 });
      }

      // Validate approval token hash (NOT verification token hash)
      const approvalTokenHash = await hashToken(token);
      if (!approvalRequest.approval_token_hash || approvalRequest.approval_token_hash !== approvalTokenHash) {
        // Rate limiting: increment failed attempts
        const failedCount = (executor.failed_attempt_count || 0) + 1;
        const shouldExpire = failedCount >= MAX_FAILED_ATTEMPTS;

        await base44.asServiceRole.entities.Executor.update(executorId, {
          failed_attempt_count: failedCount,
          last_failed_attempt_at: now.toISOString(),
          ...(shouldExpire ? {
            approval_token_hash: null,
            approval_token_expires_at: null,
          } : {}),
        });

        if (shouldExpire) {
          // Expire the approval request
          await base44.asServiceRole.entities.ExecutorApprovalRequest.update(approvalRequest.id, {
            status: 'expired',
            completed_date: now.toISOString(),
          });

          await logEvent(base44, userId, executorId, 'rate_limit_exceeded',
            `Executor ${executor.full_name} exceeded ${MAX_FAILED_ATTEMPTS} failed attempts. Approval request expired.`);

          return Response.json({ error: 'Too many failed attempts. This link has been permanently disabled.' }, { status: 429 });
        }

        await logEvent(base44, userId, executorId, 'access_denied',
          `Invalid approval token for executor ${executor.full_name} (attempt ${failedCount}/${MAX_FAILED_ATTEMPTS})`);

        return Response.json({
          error: 'Invalid or expired approval token',
          attempts_remaining: MAX_FAILED_ATTEMPTS - failedCount,
        }, { status: 403 });
      }

      // Validate approval token expiry
      if (approvalRequest.expires_at && now > new Date(approvalRequest.expires_at)) {
        await base44.asServiceRole.entities.ExecutorApprovalRequest.update(approvalRequest.id, {
          status: 'expired',
          completed_date: now.toISOString(),
        });

        await logEvent(base44, userId, executorId, 'access_denied',
          `Approval token expired for executor ${executor.full_name}`);

        return Response.json({ error: 'This approval link has expired' }, { status: 403 });
      }

      // Reset failed attempt counter on success
      await base44.asServiceRole.entities.Executor.update(executorId, {
        failed_attempt_count: 0,
        last_failed_attempt_at: null,
        approval_completed_at: now.toISOString(),
      });

      if (!protocol) {
        return Response.json({ error: 'No active protocol' }, { status: 400 });
      }

      // ── executor_approve ──
      if (action === 'executor_approve') {
        if (!executor.can_approve_release) {
          return Response.json({ error: 'This executor cannot approve release' }, { status: 403 });
        }

        // Verify ALL conditions before approving
        const coolingOffEnd = new Date(protocol.cooling_off_ends_date || now);
        const coolingOffExpired = now >= coolingOffEnd;
        const quorumMet = (protocol.contact_confirmation_count || 0) >= QUORUM_REQUIRED;

        if (!coolingOffExpired) {
          return Response.json({
            error: `Cooling-off period has not expired yet. Ends: ${coolingOffEnd.toISOString()}`,
          }, { status: 400 });
        }

        if (!quorumMet) {
          return Response.json({
            error: `Quorum not met (${protocol.contact_confirmation_count}/${QUORUM_REQUIRED})`,
          }, { status: 400 });
        }

        // Mark approval request as approved — single-use, link never works again
        await base44.asServiceRole.entities.ExecutorApprovalRequest.update(approvalRequest.id, {
          status: 'approved',
          completed_date: now.toISOString(),
          action_taken: 'approve',
          approval_token_hash: null, // Clear token — single-use
        });

        // Set executor approved and move to approved_for_release
        await base44.asServiceRole.entities.LegacyProtocol.update(protocol.id, {
          executor_approved: true,
          release_approved_date: now.toISOString(),
          status: 'approved_for_release',
        });

        await logEvent(base44, userId, executorId, 'executor_approved',
          `Executor ${executor.full_name} approved the release. Approval request: ${approvalRequest.id}`);

        return Response.json({
          success: true,
          action: 'executor_approved',
          message: 'Release approved. Memories will be released on the next processing cycle.',
        });
      }

      // ── executor_pause ──
      if (action === 'executor_pause') {
        if (!executor.can_pause_release) {
          return Response.json({ error: 'This executor cannot pause' }, { status: 403 });
        }

        // Mark approval request as paused — single-use
        await base44.asServiceRole.entities.ExecutorApprovalRequest.update(approvalRequest.id, {
          status: 'paused',
          completed_date: now.toISOString(),
          action_taken: 'pause',
          approval_token_hash: null, // Clear token — single-use
        });

        await base44.asServiceRole.entities.LegacyProtocol.update(protocol.id, {
          status: 'paused',
          paused_date: now.toISOString(),
          paused_reason: `Paused by executor ${executor.full_name}`,
        });

        await logEvent(base44, userId, executorId, 'executor_paused',
          `Executor ${executor.full_name} paused the protocol. Approval request: ${approvalRequest.id}`);

        return Response.json({
          success: true,
          action: 'executor_paused',
          message: 'Protocol paused. No memories will be released.',
        });
      }

      // ── executor_cancel ──
      if (action === 'executor_cancel') {
        if (!executor.can_cancel_release) {
          return Response.json({ error: 'This executor cannot cancel' }, { status: 403 });
        }

        // Mark approval request as cancelled — single-use
        await base44.asServiceRole.entities.ExecutorApprovalRequest.update(approvalRequest.id, {
          status: 'cancelled',
          completed_date: now.toISOString(),
          action_taken: 'cancel',
          approval_token_hash: null, // Clear token — single-use
        });

        await base44.asServiceRole.entities.LegacyProtocol.update(protocol.id, {
          status: 'cancelled',
          cancelled_date: now.toISOString(),
          cancelled_reason: `Cancelled by executor ${executor.full_name}`,
        });

        await base44.asServiceRole.entities.User.update(userId, {
          legacy_triggered: false,
          legacy_protocol_status: 'cancelled',
          legacy_confirmations: 0,
          legacy_confirmed_by_ids: [],
          legacy_cooling_off_until: null,
        });

        await logEvent(base44, userId, executorId, 'executor_cancelled',
          `Executor ${executor.full_name} cancelled the protocol. Approval request: ${approvalRequest.id}`);

        return Response.json({
          success: true,
          action: 'executor_cancelled',
          message: 'Protocol cancelled.',
        });
      }

      // ── report_mistake (executor) ──
      if (action === 'report_mistake' && executorId) {
        // Mark approval request as paused — single-use
        await base44.asServiceRole.entities.ExecutorApprovalRequest.update(approvalRequest.id, {
          status: 'paused',
          completed_date: now.toISOString(),
          action_taken: 'report_mistake',
          approval_token_hash: null, // Clear token — single-use
        });

        await base44.asServiceRole.entities.LegacyProtocol.update(protocol.id, {
          status: 'paused',
          paused_date: now.toISOString(),
          paused_reason: `Mistake reported by executor ${executor.full_name}`,
        });

        await logEvent(base44, userId, executorId, 'mistake_report',
          `Executor ${executor.full_name} reported a mistake. Protocol paused. Approval request: ${approvalRequest.id}`);

        return Response.json({
          success: true,
          action: 'mistake_reported',
          message: 'Thank you. The protocol has been paused while we investigate.',
        });
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // CONTACT ACTIONS — uses verification tokens (identity verification)
    // ═══════════════════════════════════════════════════════════════
    if (!contactId) {
      return Response.json({ error: 'Contact ID required' }, { status: 400 });
    }

    const contacts = await base44.asServiceRole.entities.TrustedContact.filter({
      id: contactId,
      created_by_id: userId,
    });
    const contact = contacts[0];
    if (!contact) {
      return Response.json({ error: 'Contact not found' }, { status: 404 });
    }

    // Only VERIFIED contacts can act
    if (contact.verification_status !== 'verified') {
      await logEvent(base44, userId, contactId, 'access_denied',
        `Unverified contact ${contact.name} attempted action ${action}`);
      return Response.json({ error: 'Contact must be verified before acting' }, { status: 403 });
    }

    // Verify token
    const tokenHash = await hashToken(token);
    if (!contact.verification_token_hash || contact.verification_token_hash !== tokenHash) {
      // Rate limiting: increment failed attempts
      const failedCount = (contact.failed_attempt_count || 0) + 1;
      const shouldExpire = failedCount >= MAX_FAILED_ATTEMPTS;

      await base44.asServiceRole.entities.TrustedContact.update(contactId, {
        failed_attempt_count: failedCount,
        last_failed_attempt_at: now.toISOString(),
        ...(shouldExpire ? {
          verification_token_hash: null,
          verification_token_expires_at: null,
        } : {}),
      });

      if (shouldExpire) {
        await logEvent(base44, userId, contactId, 'rate_limit_exceeded',
          `Contact ${contact.name} exceeded ${MAX_FAILED_ATTEMPTS} failed attempts. Token expired.`);
        return Response.json({ error: 'Too many failed attempts. This link has been permanently disabled.' }, { status: 429 });
      }

      await logEvent(base44, userId, contactId, 'access_denied',
        `Invalid contact token (attempt ${failedCount}/${MAX_FAILED_ATTEMPTS})`);
      return Response.json({
        error: 'Invalid or expired token',
        attempts_remaining: MAX_FAILED_ATTEMPTS - failedCount,
      }, { status: 403 });
    }

    // Check token expiry
    if (contact.verification_token_expires_at && now > new Date(contact.verification_token_expires_at)) {
      await logEvent(base44, userId, contactId, 'access_denied', 'Contact token expired');
      return Response.json({ error: 'This link has expired' }, { status: 403 });
    }

    // Invalidate token (single-use) and reset failed attempts
    await base44.asServiceRole.entities.TrustedContact.update(contactId, {
      verification_token_hash: null,
      verification_token_expires_at: null,
      failed_attempt_count: 0,
      last_failed_attempt_at: null,
    });

    const userName = user.full_name || 'your loved one';

    // ── mark_alive: cancel everything ──
    if (action === 'mark_alive') {
      if (protocol) {
        await base44.asServiceRole.entities.LegacyProtocol.update(protocol.id, {
          status: 'cancelled',
          cancelled_date: now.toISOString(),
          cancelled_reason: `Contact ${contact.name} confirmed user is alive`,
        });
      }

      await base44.asServiceRole.entities.User.update(userId, {
        legacy_triggered: false,
        legacy_protocol_status: 'cancelled',
        legacy_confirmations: 0,
        legacy_confirmed_by_ids: [],
        legacy_cooling_off_until: null,
        last_checkin_date: now.toISOString(),
        legacy_activity_timestamp: now.toISOString(),
      });

      await logEvent(base44, userId, contactId, 'confirmation_received_alive',
        `${contact.name} confirmed the user is alive. Protocol cancelled.`);

      await sendEmail(base44, user.email,
        'Your trusted contact confirmed you are alive',
        [
          `Dear ${userName},`,
          '',
          `${contact.name} confirmed that you are alive and well. Your legacy protocol has been cancelled.`,
          '',
          'The ETRN8 Team',
        ].join('\n')
      );

      return Response.json({
        success: true,
        action: 'marked_alive',
        message: 'User confirmed alive. Protocol cancelled.',
      });
    }

    // ── not_sure: log, no action ──
    if (action === 'not_sure') {
      await logEvent(base44, userId, contactId, 'unsure_response',
        `${contact.name} is not sure about the user's status.`);

      return Response.json({
        success: true,
        action: 'not_sure',
        message: 'Your response has been recorded. No action will be taken at this time.',
      });
    }

    // ── report_mistake: pause the protocol ──
    if (action === 'report_mistake') {
      if (protocol) {
        await base44.asServiceRole.entities.LegacyProtocol.update(protocol.id, {
          status: 'paused',
          paused_date: now.toISOString(),
          paused_reason: `Mistake reported by ${contact.name}`,
        });
      }

      await logEvent(base44, userId, contactId, 'mistake_report',
        `${contact.name} reported a mistake. Protocol paused.`);

      return Response.json({
        success: true,
        action: 'mistake_reported',
        message: 'Thank you. The protocol has been paused while we investigate.',
      });
    }

    // ── pause: pause the protocol ──
    if (action === 'pause') {
      if (protocol) {
        await base44.asServiceRole.entities.LegacyProtocol.update(protocol.id, {
          status: 'paused',
          paused_date: now.toISOString(),
          paused_reason: `Paused by ${contact.name}`,
        });
      }

      await logEvent(base44, userId, contactId, 'protocol_paused',
        `${contact.name} paused the protocol.`);

      return Response.json({
        success: true,
        action: 'paused',
        message: 'Protocol paused.',
      });
    }

    // ── confirm_passed: count toward quorum ──
    if (action === 'confirm_passed') {
      if (!protocol) {
        return Response.json({ error: 'No active protocol' }, { status: 400 });
      }

      const confirmedByIds = user.legacy_confirmed_by_ids || [];
      if (confirmedByIds.includes(contactId)) {
        return Response.json({
          message: 'You have already confirmed',
          already_confirmed: true,
          total_confirmations: protocol.contact_confirmation_count || 0,
          required_quorum: QUORUM_REQUIRED,
        });
      }

      const newConfirmedByIds = [...confirmedByIds, contactId];
      const newCount = (protocol.contact_confirmation_count || 0) + 1;

      await base44.asServiceRole.entities.LegacyProtocol.update(protocol.id, {
        contact_confirmation_count: newCount,
      });

      await base44.asServiceRole.entities.User.update(userId, {
        legacy_confirmations: newCount,
        legacy_confirmed_by_ids: newConfirmedByIds,
      });

      await logEvent(base44, userId, contactId, 'confirmation_received_passed',
        `${contact.name} confirmed passing. ${newCount}/${QUORUM_REQUIRED} confirmations.`);

      if (newCount < QUORUM_REQUIRED) {
        // Start cooling-off timer if not already started
        if (!protocol.cooling_off_started_date) {
          const coolingOffEnd = new Date(now.getTime() + COOLING_OFF_DAYS * 24 * 60 * 60 * 1000);
          await base44.asServiceRole.entities.LegacyProtocol.update(protocol.id, {
            cooling_off_started_date: now.toISOString(),
            cooling_off_ends_date: coolingOffEnd.toISOString(),
          });
          await base44.asServiceRole.entities.User.update(userId, {
            legacy_cooling_off_until: coolingOffEnd.toISOString(),
          });
          await logEvent(base44, userId, contactId, 'cooling_off_started',
            `Cooling-off started (${COOLING_OFF_DAYS} days). ${newCount}/${QUORUM_REQUIRED} confirmations.`);

          // Email user urgent warning
          await sendEmail(base44, user.email,
            `URGENT: A trusted contact has confirmed your passing`,
            [
              `Dear ${userName},`,
              '',
              'One of your trusted contacts has confirmed that you have passed away.',
              '',
              `A ${COOLING_OFF_DAYS}-day cooling-off period has started.`,
              '',
              'IF YOU ARE ALIVE: OPEN THE APP IMMEDIATELY to cancel this process.',
              '',
              'The ETRN8 Team',
            ].join('\n')
          );
        }

        return Response.json({
          success: true,
          action: 'confirmation_recorded',
          message: `Confirmation recorded. ${newCount}/${QUORUM_REQUIRED} needed.`,
          total_confirmations: newCount,
          required_quorum: QUORUM_REQUIRED,
          quorum_met: false,
        });
      }

      // Quorum met
      return Response.json({
        success: true,
        action: 'quorum_met',
        message: `Quorum met (${newCount}/${QUORUM_REQUIRED}). Cooling-off period active.`,
        total_confirmations: newCount,
        required_quorum: QUORUM_REQUIRED,
        quorum_met: true,
        cooling_off_days: COOLING_OFF_DAYS,
      });
    }

    return Response.json({ error: 'Action not handled' }, { status: 400 });
  } catch (error) {
    console.error('confirmLegacy error:', error);
    return Response.json({ error: 'An internal error occurred' }, { status: 500 });
  }
});