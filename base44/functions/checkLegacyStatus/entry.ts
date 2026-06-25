import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const COOLING_OFF_DAYS = 14;
const QUORUM_REQUIRED = 2;
const TOKEN_EXPIRY_DAYS = 7;
const WARNING_STAGE_DAYS = { stage_2: 3, final: 7, welfare: 10, death_verification: 13 };

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

function daysBetween(a, b) {
  return Math.floor((b - a) / (1000 * 60 * 60 * 24));
}

async function sendEmail(base44, to, subject, body) {
  try {
    await base44.asServiceRole.integrations.Core.SendEmail({ to, subject, body });
    return true;
  } catch (e) {
    console.error('Failed to email', to, ':', e.message);
    return false;
  }
}

async function logEvent(base44, userId, eventType, details, contactId) {
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

async function getOrCreateProtocol(base44, userId) {
  const protocols = await base44.asServiceRole.entities.LegacyProtocol.filter({ user_id: userId });
  const active = protocols.find(p =>
    !['released', 'cancelled', 'cancelled_by_user_activity'].includes(p.status)
  );
  if (active) return active;

  const now = new Date().toISOString();
  const created = await base44.asServiceRole.entities.LegacyProtocol.create({
    user_id: userId,
    status: 'warning_stage_1',
    started_date: now,
    current_stage_date: now,
    contact_confirmation_count: 0,
    executor_approved: false,
  });
  return created;
}

async function updateProtocol(base44, protocolId, updates) {
  await base44.asServiceRole.entities.LegacyProtocol.update(protocolId, updates);
}

async function generateConfirmToken(base44, contact) {
  const rawToken = crypto.randomUUID();
  const tokenHash = await hashToken(rawToken);
  const expiresAt = addDays(new Date(), TOKEN_EXPIRY_DAYS).toISOString();

  await base44.asServiceRole.entities.TrustedContact.update(contact.id, {
    verification_token_hash: tokenHash,
    verification_token_expires_at: expiresAt,
  });

  return rawToken;
}

function buildConfirmUrl(origin, userId, contactId, token, action) {
  return `${origin || 'https://app.base44.app'}/legacy-confirm?user=${userId}&contact=${contactId}&token=${encodeURIComponent(token)}&action=${action}`;
}

async function getVerifiedContacts(base44, userId) {
  return await base44.asServiceRole.entities.TrustedContact.filter({
    created_by_id: userId,
    verification_status: 'verified',
  });
}

async function getVerifiedExecutor(base44, userId) {
  const executors = await base44.asServiceRole.entities.Executor.filter({
    user_id: userId,
    verification_status: 'verified',
  });
  return executors[0] || null;
}

/**
 * Release memories using the full validation pipeline.
 * Content is only released to recipients who pass validateRecipientOwnership.
 * Uses strict ID-based matching — no name-based matching to prevent cross-recipient leakage.
 */
async function releaseMemories(base44, user, protocol, eligibleMemories, eligibleNotes) {
  const now = new Date();

  // Update protocol to released
  await updateProtocol(base44, protocol.id, {
    status: 'released',
    released_date: now.toISOString(),
  });

  // Update user
  await base44.asServiceRole.entities.User.update(user.id, {
    legacy_confirmed: true,
    legacy_confirmed_at: now.toISOString(),
    legacy_protocol_status: 'released',
  });

  await logEvent(base44, user.id, 'protocol_released',
    'Legacy protocol completed. All validated content released to recipients.');

  // Get all verified trusted contacts and executors as potential recipients
  const verifiedContacts = await getVerifiedContacts(base44, user.id);
  const verifiedExecutor = await getVerifiedExecutor(base44, user.id);
  const allRecipients = [...verifiedContacts];
  if (verifiedExecutor) allRecipients.push(verifiedExecutor);

  const userName = user.full_name || 'your loved one';
  let totalReleased = 0;
  let recipientsWhoReceived = 0;

  for (const recipient of allRecipients) {
    const recipientId = recipient.id;
    const recipientName = recipient.name || recipient.full_name || 'friend';
    const recipientEmail = recipient.email;

    // Call validateRecipientOwnership — strict ID-based validation
    // Prevents cross-recipient content leakage
    const ownership = await base44.asServiceRole.functions.invoke('validateRecipientOwnership', {
      user_id: user.id,
      recipient_id: recipientId,
      memories: eligibleMemories,
      notes: eligibleNotes,
    });

    if (!ownership.data || !ownership.data.valid) {
      await logEvent(base44, user.id, 'recipient_validation_failed',
        `Recipient ${recipientName} (${recipientId}) failed ownership validation. No content released to this recipient.`);
      continue;
    }

    const recipientMemories = ownership.data.valid_memories || [];
    const recipientNotes = ownership.data.valid_notes || [];

    if (recipientMemories.length === 0 && recipientNotes.length === 0) continue;

    // Build email content
    let content = '';
    for (const mem of recipientMemories) {
      content += `\n---\n"${mem.title}"\n`;
      if (mem.memory_date) content += `Date: ${mem.memory_date}\n`;
      if (mem.scheduled_occasion) content += `Occasion: ${mem.scheduled_occasion}\n`;
      if (mem.content) content += `${mem.content}\n`;
      if (mem.memory_type === 'photo') content += '[Photo — view in ETRN8 app]\n';
      if (mem.memory_type === 'voice') content += '[Voice recording — listen in ETRN8 app]\n';
      if (mem.memory_type === 'video') content += '[Video — watch in ETRN8 app]\n';
      content += '---\n';
    }

    for (const note of recipientNotes) {
      content += `\n---\nPrivate Note: "${note.title}"\n`;
      if (note.content) content += `${note.content}\n`;
      content += '---\n';
    }

    await sendEmail(base44, recipientEmail,
      `Legacy memories from ${userName}`,
      [
        `Dear ${recipientName},`,
        '',
        `The passing of ${userName} has been independently confirmed by their trusted contacts and approved by their executor.`,
        '',
        'Below are the legacy memories, letters, and messages they entrusted to you.',
        '',
        content,
        '',
        'These memories were preserved with love and care.',
        '',
        'With care,',
        'The ETRN8 Team',
      ].join('\n')
    );

    // Mark memories as released
    for (const mem of recipientMemories) {
      await base44.asServiceRole.entities.Memory.update(mem.id, {
        delivery_status: 'legacy_released',
        legacy_released_date: now.toISOString(),
      });
      await logEvent(base44, user.id, 'memory_legacy_released',
        `Memory "${mem.title}" released to ${recipientName}.`, null);
    }

    totalReleased += recipientMemories.length + recipientNotes.length;
    recipientsWhoReceived++;
  }

  await logEvent(base44, user.id, 'protocol_released',
    `Released ${totalReleased} items to ${recipientsWhoReceived} recipient(s) out of ${allRecipients.length} potential recipients.`);

  return { releasedCount: totalReleased, recipientCount: recipientsWhoReceived };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const origin = req.headers.get('origin') || 'https://app.base44.app';
    const now = new Date();

    const allUsers = await base44.asServiceRole.entities.User.list();
    const results = [];

    // ── PASS 1: Check for newly-eligible users (start protocol) ──
    const eligibleUsers = allUsers.filter(u =>
      u.legacy_enabled === true &&
      u.legacy_triggered !== true &&
      u.legacy_confirmed !== true
    );

    for (const user of eligibleUsers) {
      const activityDate = user.legacy_activity_timestamp || user.last_checkin_date;
      if (!activityDate) continue;

      const lastActivity = new Date(activityDate);
      const waitMonths = user.legacy_wait_months || 3;
      const threshold = new Date(lastActivity);
      threshold.setMonth(threshold.getMonth() + waitMonths);

      if (now < threshold) continue;

      // Trigger protocol
      const protocol = await getOrCreateProtocol(base44, user.id);

      await base44.asServiceRole.entities.User.update(user.id, {
        legacy_triggered: true,
        legacy_protocol_status: 'verification_pending',
        legacy_notification_count: 1,
        legacy_last_notification_at: now.toISOString(),
      });

      await logEvent(base44, user.id, 'protocol_triggered',
        `Protocol triggered after ${waitMonths} month(s) of inactivity. Last activity: ${activityDate}`);

      // Send warning_stage_1 email to user
      await sendEmail(base44, user.email,
        `We haven't heard from you in a while`,
        [
          `Dear ${user.full_name || 'friend'},`,
          '',
          `We noticed you haven't been active on ETRN8 in ${waitMonths} month(s).`,
          '',
          'Your legacy protocol has been started. This means we will begin reaching out to your trusted contacts to verify your wellbeing.',
          '',
          'If you are reading this, simply open the app to check in and cancel this process immediately.',
          '',
          'With care,',
          'The ETRN8 Team',
        ].join('\n')
      );

      await logEvent(base44, user.id, 'warning_email_sent',
        'Warning stage 1 email sent to user.');

      results.push({
        user_id: user.id,
        user_name: user.full_name,
        action: 'protocol_triggered',
        stage: 'warning_stage_1',
      });
    }

    // ── PASS 2: Advance existing protocols through stages ──
    const protocols = await base44.asServiceRole.entities.LegacyProtocol.list();
    const activeProtocols = protocols.filter(p =>
      !['released', 'cancelled', 'cancelled_by_user_activity', 'idle'].includes(p.status)
    );

    for (const protocol of activeProtocols) {
      const user = allUsers.find(u => u.id === protocol.user_id);
      if (!user) continue;

      const stageDate = new Date(protocol.current_stage_date);
      const daysInStage = daysBetween(stageDate, now);
      const userName = user.full_name || 'your loved one';

      // ── warning_stage_1 → warning_stage_2 ──
      if (protocol.status === 'warning_stage_1' && daysInStage >= WARNING_STAGE_DAYS.stage_2) {
        await updateProtocol(base44, protocol.id, {
          status: 'warning_stage_2',
          current_stage_date: now.toISOString(),
        });

        await sendEmail(base44, user.email,
          `Reminder: Please check in on ETRN8`,
          [
            `Dear ${userName},`,
            '',
            'This is your second reminder. We still haven\'t heard from you.',
            '',
            'If you are reading this, open the app to check in and cancel the legacy process.',
            '',
            'With care,',
            'The ETRN8 Team',
          ].join('\n')
        );

        await logEvent(base44, user.id, 'warning_email_sent', 'Warning stage 2 email sent.');
        results.push({ user_id: user.id, action: 'stage_advanced', stage: 'warning_stage_2' });
      }

      // ── warning_stage_2 → final_user_warning ──
      else if (protocol.status === 'warning_stage_2' && daysInStage >= (WARNING_STAGE_DAYS.final - WARNING_STAGE_DAYS.stage_2)) {
        await updateProtocol(base44, protocol.id, {
          status: 'final_user_warning',
          current_stage_date: now.toISOString(),
        });

        await sendEmail(base44, user.email,
          `URGENT: Final warning — your legacy protocol is about to escalate`,
          [
            `Dear ${userName},`,
            '',
            'This is your FINAL warning.',
            '',
            'If you do not check in soon, we will begin contacting your trusted contacts to verify your wellbeing.',
            '',
            'OPEN THE APP NOW to cancel this process.',
            '',
            'The ETRN8 Team',
          ].join('\n')
        );

        await logEvent(base44, user.id, 'warning_email_sent', 'Final user warning email sent.');
        results.push({ user_id: user.id, action: 'stage_advanced', stage: 'final_user_warning' });
      }

      // ── final_user_warning → welfare_check ──
      else if (protocol.status === 'final_user_warning' && daysInStage >= (WARNING_STAGE_DAYS.welfare - WARNING_STAGE_DAYS.final)) {
        await updateProtocol(base44, protocol.id, {
          status: 'welfare_check',
          current_stage_date: now.toISOString(),
        });

        await sendEmail(base44, user.email,
          `Welfare check: We are contacting your trusted contacts`,
          [
            `Dear ${userName},`,
            '',
            'We have not heard from you despite multiple warnings.',
            '',
            'We are now initiating a welfare check by contacting your trusted contacts.',
            '',
            'If you are still with us, PLEASE open the app immediately.',
            '',
            'The ETRN8 Team',
          ].join('\n')
        );

        await logEvent(base44, user.id, 'welfare_check_sent', 'Welfare check initiated.');
        results.push({ user_id: user.id, action: 'stage_advanced', stage: 'welfare_check' });
      }

      // ── welfare_check → death_verification ──
      else if (protocol.status === 'welfare_check' && daysInStage >= (WARNING_STAGE_DAYS.death_verification - WARNING_STAGE_DAYS.welfare)) {
        await updateProtocol(base44, protocol.id, {
          status: 'death_verification',
          current_stage_date: now.toISOString(),
        });

        // Send confirmation links to VERIFIED contacts only
        const verifiedContacts = await getVerifiedContacts(base44, user.id);

        for (const contact of verifiedContacts) {
          const rawToken = await generateConfirmToken(base44, contact);
          const confirmUrl = buildConfirmUrl(origin, user.id, contact.id, rawToken, 'confirm_passed');
          const aliveUrl = buildConfirmUrl(origin, user.id, contact.id, rawToken, 'mark_alive');
          const unsureUrl = buildConfirmUrl(origin, user.id, contact.id, rawToken, 'not_sure');
          const mistakeUrl = buildConfirmUrl(origin, user.id, contact.id, rawToken, 'report_mistake');

          await sendEmail(base44, contact.email,
            `We need your help: Can you verify ${userName}'s wellbeing?`,
            [
              `Dear ${contact.name},`,
              '',
              `${userName} entrusted you as a trusted contact.`,
              `We haven't heard from them despite multiple attempts to reach them.`,
              '',
              'Please help us verify their wellbeing. Click ONE of the options below:',
              '',
              `• They are alive and well: ${aliveUrl}`,
              `• I confirm they have passed: ${confirmUrl}`,
              `• I am not sure: ${unsureUrl}`,
              `• Report a mistake: ${mistakeUrl}`,
              '',
              `These links expire in ${TOKEN_EXPIRY_DAYS} days and can only be used once.`,
              '',
              'There is no pressure — take the time you need.',
              '',
              'With care,',
              'The ETRN8 Team',
            ].join('\n')
          );

          await logEvent(base44, user.id, 'death_confirmation_requested',
            `Confirmation request sent to ${contact.name}.`, contact.id);
        }

        await logEvent(base44, user.id, 'welfare_check_sent',
          `Death verification stage started. ${verifiedContacts.length} verified contact(s) notified.`);
        results.push({ user_id: user.id, action: 'stage_advanced', stage: 'death_verification' });
      }

      // ── death_verification: check if quorum met → start cooling_off ──
      else if (protocol.status === 'death_verification') {
        const confirmationCount = protocol.contact_confirmation_count || 0;
        if (confirmationCount >= QUORUM_REQUIRED && !protocol.cooling_off_started_date) {
          const coolingOffEnd = addDays(now, COOLING_OFF_DAYS);

          await updateProtocol(base44, protocol.id, {
            status: 'cooling_off',
            cooling_off_started_date: now.toISOString(),
            cooling_off_ends_date: coolingOffEnd.toISOString(),
            current_stage_date: now.toISOString(),
          });

          await base44.asServiceRole.entities.User.update(user.id, {
            legacy_cooling_off_until: coolingOffEnd.toISOString(),
          });

          await logEvent(base44, user.id, 'cooling_off_started',
            `Cooling-off period started (${COOLING_OFF_DAYS} days). Ends ${coolingOffEnd.toISOString()}.`);

          // Email user final warning
          await sendEmail(base44, user.email,
            `URGENT: Your legacy memories will be released in ${COOLING_OFF_DAYS} days`,
            [
              `Dear ${userName},`,
              '',
              `Two of your trusted contacts have confirmed your passing.`,
              '',
              `A ${COOLING_OFF_DAYS}-day cooling-off period has started.`,
              '',
              'IF YOU ARE READING THIS AND ARE ALIVE:',
              'OPEN THE APP IMMEDIATELY to cancel this process.',
              '',
              'After the cooling-off period, your legacy memories will be released to your recipients.',
              '',
              'The ETRN8 Team',
            ].join('\n')
          );

          // Email all verified trusted contacts
          const verifiedContacts = await getVerifiedContacts(base44, user.id);
          for (const contact of verifiedContacts) {
            await sendEmail(base44, contact.email,
              `Update: Cooling-off period started for ${userName}`,
              [
                `Dear ${contact.name},`,
                '',
                `Two trusted contacts have confirmed the passing of ${userName}.`,
                '',
                `A ${COOLING_OFF_DAYS}-day cooling-off period has started.`,
                '',
                'If you believe this is a mistake, please ask them to open the app.',
                '',
                'With care,',
                'The ETRN8 Team',
              ].join('\n')
            );
          }

          // Email verified executor
          const executor = await getVerifiedExecutor(base44, user.id);
          if (executor) {
            await sendEmail(base44, executor.email,
              `Action may be required soon: Legacy release for ${userName}`,
              [
                `Dear ${executor.full_name},`,
                '',
                `Two trusted contacts have confirmed the passing of ${userName}.`,
                '',
                `A ${COOLING_OFF_DAYS}-day cooling-off period has started.`,
                '',
                'After the cooling-off period, you will be asked to approve or pause the release.',
                '',
                'With care,',
                'The ETRN8 Team',
              ].join('\n')
            );
          }

          results.push({ user_id: user.id, action: 'cooling_off_started', days: COOLING_OFF_DAYS });
        }
      }

      // ── cooling_off: check if expired → executor_required or executor_review ──
      else if (protocol.status === 'cooling_off') {
        const coolingOffEnd = new Date(protocol.cooling_off_ends_date);
        if (now >= coolingOffEnd) {
          const executor = await getVerifiedExecutor(base44, user.id);

          if (!executor) {
            // NO EXECUTOR → pause at executor_required. NEVER auto-release.
            await updateProtocol(base44, protocol.id, {
              status: 'executor_required',
              current_stage_date: now.toISOString(),
            });

            await logEvent(base44, user.id, 'cooling_off_expired',
              'Cooling-off expired but no verified executor exists. Protocol paused at executor_required. Memories will NOT be released until an executor is designated and verified.');

            // Email user
            await sendEmail(base44, user.email,
              `Action required: No executor designated`,
              [
                `Dear ${userName},`,
                '',
                'Your legacy protocol has reached the executor stage, but no verified executor has been designated.',
                '',
                'Your memories will NOT be released until you designate and verify an executor.',
                '',
                'If you are reading this, open the app to designate an executor or cancel the process.',
                '',
                'The ETRN8 Team',
              ].join('\n')
            );

            results.push({ user_id: user.id, action: 'executor_required', reason: 'no_executor' });
          } else {
            // Executor exists → move to executor_review and create SEPARATE approval request
            await updateProtocol(base44, protocol.id, {
              status: 'executor_review',
              current_stage_date: now.toISOString(),
            });

            await logEvent(base44, user.id, 'cooling_off_expired',
              'Cooling-off expired. Awaiting executor approval.');

            // ── Create a SEPARATE ExecutorApprovalRequest ──
            // Do NOT reuse verification tokens for approval actions
            const rawApprovalToken = crypto.randomUUID();
            const approvalTokenHash = await hashToken(rawApprovalToken);
            const approvalExpiresAt = addDays(new Date(), TOKEN_EXPIRY_DAYS).toISOString();

            const approvalRequest = await base44.asServiceRole.entities.ExecutorApprovalRequest.create({
              executor_id: executor.id,
              user_id: user.id,
              protocol_id: protocol.id,
              approval_token_hash: approvalTokenHash,
              expires_at: approvalExpiresAt,
              status: 'pending',
            });

            // Link the approval request to the protocol
            await updateProtocol(base44, protocol.id, {
              executor_approval_request_id: approvalRequest.id,
            });

            // Store approval token on executor (separate from verification token)
            await base44.asServiceRole.entities.Executor.update(executor.id, {
              approval_token_hash: approvalTokenHash,
              approval_token_expires_at: approvalExpiresAt,
              approval_requested_at: now.toISOString(),
            });

            // Build approval URLs using the approval request ID
            const approveUrl = `${origin}/legacy-confirm?user=${user.id}&executor=${executor.id}&approval=${approvalRequest.id}&token=${encodeURIComponent(rawApprovalToken)}&action=executor_approve`;
            const pauseUrl = `${origin}/legacy-confirm?user=${user.id}&executor=${executor.id}&approval=${approvalRequest.id}&token=${encodeURIComponent(rawApprovalToken)}&action=executor_pause`;
            const cancelUrl = `${origin}/legacy-confirm?user=${user.id}&executor=${executor.id}&approval=${approvalRequest.id}&token=${encodeURIComponent(rawApprovalToken)}&action=executor_cancel`;
            const mistakeUrl = `${origin}/legacy-confirm?user=${user.id}&executor=${executor.id}&approval=${approvalRequest.id}&token=${encodeURIComponent(rawApprovalToken)}&action=report_mistake`;

            await sendEmail(base44, executor.email,
              `Action required: Approve legacy release for ${userName}`,
              [
                `Dear ${executor.full_name},`,
                '',
                `You are the designated executor for ${userName}.`,
                '',
                'The verification process has completed:',
                `• ${protocol.contact_confirmation_count} trusted contact(s) confirmed their passing`,
                `• The ${COOLING_OFF_DAYS}-day cooling-off period has ended`,
                '',
                'Your approval is required before any memories are released.',
                '',
                'Please choose ONE:',
                '',
                `• Approve release: ${approveUrl}`,
                `• Pause process: ${pauseUrl}`,
                `• Cancel process: ${cancelUrl}`,
                `• Report a mistake: ${mistakeUrl}`,
                '',
                `These links expire in ${TOKEN_EXPIRY_DAYS} days and can only be used once.`,
                '',
                'You are the final safeguard. Take the time you need.',
                '',
                'With care,',
                'The ETRN8 Team',
              ].join('\n')
            );

            await logEvent(base44, user.id, 'executor_approval_requested',
              `Executor approval request created (${approvalRequest.id}). Email sent to ${executor.full_name}.`, executor.id);

            results.push({ user_id: user.id, action: 'executor_review', executor: executor.full_name, approval_request_id: approvalRequest.id });
          }
        }
      }

      // ── approved_for_release: execute the release with full validation pipeline ──
      else if (protocol.status === 'approved_for_release') {
        // Step 1: Call validateLegacyRelease — single source of truth for release authorization
        const validation = await base44.asServiceRole.functions.invoke('validateLegacyRelease', {
          protocol_id: protocol.id,
          user_id: user.id,
        });

        if (!validation.data || !validation.data.valid) {
          const reasons = validation.data?.reasons || ['Unknown validation failure'];
          await logEvent(base44, user.id, 'release_validation_failed',
            `Release blocked by validateLegacyRelease: ${reasons.join('; ')}`);
          results.push({ user_id: user.id, action: 'release_blocked', reasons });
          continue;
        }

        // Step 2: Call validateContentEligibility — get only eligible content
        const eligibility = await base44.asServiceRole.functions.invoke('validateContentEligibility', {
          user_id: user.id,
        });

        if (!eligibility.data || !eligibility.data.valid) {
          await logEvent(base44, user.id, 'release_validation_failed',
            'Release blocked by validateContentEligibility — no eligible content');
          results.push({ user_id: user.id, action: 'release_blocked', reason: 'no_eligible_content' });
          continue;
        }

        const eligibleMemories = eligibility.data.eligible_memories || [];
        const eligibleNotes = eligibility.data.eligible_notes || [];

        if (eligibleMemories.length === 0 && eligibleNotes.length === 0) {
          await logEvent(base44, user.id, 'release_validation_failed',
            'Release blocked — no eligible memories or notes to release');
          results.push({ user_id: user.id, action: 'release_blocked', reason: 'no_eligible_content' });
          continue;
        }

        // Step 3: Generate release summary log BEFORE release
        const verifiedContacts = await getVerifiedContacts(base44, user.id);
        const executor = await getVerifiedExecutor(base44, user.id);
        const coolingOffDuration = protocol.cooling_off_ends_date && protocol.cooling_off_started_date
          ? Math.round((new Date(protocol.cooling_off_ends_date) - new Date(protocol.cooling_off_started_date)) / (1000 * 60 * 60 * 24))
          : 0;

        // Collect all recipients from eligible content
        const allRecipientIds = new Set();
        for (const mem of eligibleMemories) {
          if (mem.recipient_ids) mem.recipient_ids.forEach(r => allRecipientIds.add(r));
          if (mem.loved_one_id) allRecipientIds.add(mem.loved_one_id);
        }
        for (const note of eligibleNotes) {
          if (note.subject_friend_id) allRecipientIds.add(note.subject_friend_id);
        }

        // Compute content type counts for release summary
        const contentTypeCounts = {};
        for (const mem of eligibleMemories) {
          const type = mem.memory_type || 'text';
          contentTypeCounts[type] = (contentTypeCounts[type] || 0) + 1;
        }

        // Fetch approval request for integrity log
        let approvalRequestId = protocol.executor_approval_request_id || 'none';
        if (protocol.executor_approval_request_id) {
          const approvalReqs = await base44.asServiceRole.entities.ExecutorApprovalRequest.filter({
            id: protocol.executor_approval_request_id,
          });
          if (approvalReqs[0]) {
            approvalRequestId = approvalReqs[0].id;
          }
        }

        // Generate release summary with content type breakdown
        const summaryParts = [
          `RELEASE SUMMARY — Protocol: ${protocol.id}`,
          `Executor: ${executor?.id || 'none'} (${executor?.full_name || 'none'})`,
          `Approval Request: ${approvalRequestId}`,
          `Confirmed contacts: ${protocol.contact_confirmation_count}`,
          `Cooling-off: ${coolingOffDuration} days`,
          `Total memories: ${eligibleMemories.length}`,
          `Text memories: ${contentTypeCounts.text || 0}`,
          `Photo memories: ${contentTypeCounts.photo || 0}`,
          `Voice/audio memories: ${contentTypeCounts.voice || 0}`,
          `Video memories: ${contentTypeCounts.video || 0}`,
          `Private notes: ${eligibleNotes.length}`,
          `Recipients: ${allRecipientIds.size} (${[...allRecipientIds].join(', ')})`,
        ];

        await logEvent(base44, user.id, 'protocol_released', summaryParts.join(' | '));

        // Release integrity audit log — immutable record
        await logEvent(base44, user.id, 'protocol_released',
          `RELEASE INTEGRITY — protocol_id: ${protocol.id} | executor_id: ${executor?.id || 'none'} | approval_request_id: ${approvalRequestId} | recipient_count: ${allRecipientIds.size} | total_content: ${eligibleMemories.length + eligibleNotes.length} | text: ${contentTypeCounts.text || 0} | photo: ${contentTypeCounts.photo || 0} | voice: ${contentTypeCounts.voice || 0} | video: ${contentTypeCounts.video || 0} | notes: ${eligibleNotes.length} | release_timestamp: ${now.toISOString()}`);

        // Step 4: Execute the release with validated content
        // validateRecipientOwnership is called inside releaseMemories for each recipient
        const releaseResult = await releaseMemories(base44, user, protocol, eligibleMemories, eligibleNotes);
        results.push({ user_id: user.id, action: 'released', ...releaseResult });
      }
    }

    return Response.json({
      checked_at: now.toISOString(),
      total_actions: results.length,
      details: results,
    });
  } catch (error) {
    console.error('checkLegacyStatus error:', error);
    return Response.json({ error: 'An internal error occurred' }, { status: 500 });
  }
});