import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { requireInternalSecret } from '../_shared/internalAuth.ts';

const MAX_DELIVERY_ATTEMPTS = 3;

/**
 * Production Scheduled Memory Delivery Processor — daily job.
 *
 * Groups memories scheduled for the same date and recipient into a single
 * story-style email. Each memory is presented as a "chapter" with its title
 * in quotes and content below, mimicking the in-app Story mode.
 */
Deno.serve(async (req) => {
  try {
    const authError = requireInternalSecret(req);
    if (authError) return authError;

    const base44 = createClientFromRequest(req);
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Get all scheduled memories due for delivery
    const allMemories = await base44.asServiceRole.entities.Memory.list('-created_date', 500);

    // Helper: get current date and time in a given IANA timezone
    const getNowInTz = (tz) => {
      try {
        const parts = new Intl.DateTimeFormat('en-CA', {
          timeZone: tz || 'UTC',
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit', hour12: false,
        }).formatToParts(now);
        const pm = {};
        for (const p of parts) pm[p.type] = p.value;
        return { date: `${pm.year}-${pm.month}-${pm.day}`, time: `${pm.hour}:${pm.minute}` };
      } catch {
        // Invalid timezone — fall back to UTC
        return { date: todayStr, time: now.toISOString().slice(11, 16) };
      }
    };

    // Filter: scheduled, delivery_status = scheduled, and the scheduled date+time has passed
    // Times are in the user's local timezone (stored in scheduled_timezone), not server time
    const dueMemories = allMemories.filter(m => {
      if (m.delivery_status !== 'scheduled' || !m.is_scheduled || !m.scheduled_date) return false;
      if ((m.delivery_attempts || 0) >= MAX_DELIVERY_ATTEMPTS) return false;

      const { date: todayInTz, time: nowTimeInTz } = getNowInTz(m.scheduled_timezone);

      // Past dates are always due
      if (m.scheduled_date < todayInTz) return true;

      // Same date: check if the scheduled time has passed (defaults to 09:00)
      if (m.scheduled_date === todayInTz) {
        const scheduledTime = m.scheduled_time || '09:00';
        return nowTimeInTz >= scheduledTime;
      }

      return false;
    });

    const results = [];

    // First pass: resolve recipient for each memory and check legacy status
    const deliverableGroups = {}; // key: `${recipientEmail}__${scheduledDate}`
    const convertedToLegacy = [];

    for (const memory of dueMemories) {
      const userId = memory.created_by_id;

      if (memory.is_private) {
        results.push({
          memory_id: memory.id,
          title: memory.title,
          action: 'skipped',
          reason: 'private_memory',
        });
        continue;
      }

      // Check if user has an active legacy protocol
      const protocols = await base44.asServiceRole.entities.LegacyProtocol.filter({ user_id: userId });
      const activeProtocol = protocols.find(p =>
        !['released', 'cancelled', 'cancelled_by_user_activity', 'idle'].includes(p.status)
      );

      if (activeProtocol) {
        await base44.asServiceRole.entities.Memory.update(memory.id, {
          delivery_status: 'legacy_pending',
          delivery_type: 'legacy',
        });

        await base44.asServiceRole.entities.LegacyAuditLog.create({
          user_id: userId,
          content_type: 'memory',
          content_id: memory.id,
          event_type: 'failed_delivery',
          details: `Scheduled memory "${memory.title}" not delivered — legacy protocol active. Converted to legacy content.`,
        });

        convertedToLegacy.push({
          memory_id: memory.id,
          title: memory.title,
          action: 'converted_to_legacy',
          reason: 'legacy_protocol_active',
        });
        continue;
      }

      // Resolve recipient email
      let recipientEmail = null;
      let recipientName = null;

      if (memory.loved_one_id) {
        const lovedOnes = await base44.asServiceRole.entities.LovedOne.filter({ id: memory.loved_one_id });
        if (lovedOnes[0]?.email) {
          recipientEmail = lovedOnes[0].email;
          recipientName = lovedOnes[0].name;
        }
      }

      if (!recipientEmail && memory.recipient_ids?.length > 0) {
        for (const rid of memory.recipient_ids) {
          const contacts = await base44.asServiceRole.entities.TrustedContact.filter({ id: rid });
          if (contacts[0]?.email) {
            recipientEmail = contacts[0].email;
            recipientName = contacts[0].name;
            break;
          }
        }
      }

      if (!recipientEmail) {
        // No email found — log failed delivery with retry tracking
        const attempts = (memory.delivery_attempts || 0) + 1;
        const isLastAttempt = attempts >= MAX_DELIVERY_ATTEMPTS;

        await base44.asServiceRole.entities.Memory.update(memory.id, {
          delivery_attempts: attempts,
          last_attempt_date: now.toISOString(),
          last_delivery_error: 'No recipient email found',
          ...(isLastAttempt ? { delivery_status: 'cancelled' } : {}),
        });

        await base44.asServiceRole.entities.LegacyAuditLog.create({
          user_id: userId,
          content_type: 'memory',
          content_id: memory.id,
          event_type: isLastAttempt ? 'failed_delivery' : 'delivery_retry',
          details: `Scheduled memory "${memory.title}" could not be delivered — no recipient email. Attempt ${attempts}/${MAX_DELIVERY_ATTEMPTS}.${isLastAttempt ? ' Marked as cancelled.' : ''}`,
        });

        results.push({
          memory_id: memory.id,
          title: memory.title,
          action: isLastAttempt ? 'failed' : 'retry',
          reason: 'no_recipient_email',
          attempts,
        });
        continue;
      }

      // Group by recipient + scheduled date
      const groupKey = `${recipientEmail}__${memory.scheduled_date}`;
      if (!deliverableGroups[groupKey]) {
        deliverableGroups[groupKey] = {
          recipientEmail,
          recipientName,
          scheduledDate: memory.scheduled_date,
          memories: [],
        };
      }
      deliverableGroups[groupKey].memories.push(memory);
    }

    // Add legacy conversions to results
    results.push(...convertedToLegacy);

    // Second pass: send one story-style email per group
    for (const [groupKey, group] of Object.entries(deliverableGroups)) {
      const { recipientEmail, recipientName, scheduledDate, memories } = group;
      const userName = memories[0].created_by_name || 'your loved one';
      const memoryCount = memories.length;

      // Build story-style email body
      const formattedDate = new Date(scheduledDate).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      });

      const escapeHtml = (str) => (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

      const mediaLabels = {
        photo: '📷 Photo — view in the ETERN8 app',
        voice: '🎤 Voice recording — listen in the ETERN8 app',
        video: '🎬 Video — watch in the ETERN8 app',
      };

      const memoryChapters = memories.map((memory, idx) => {
        const parts = [];
        if (memoryCount > 1) {
          parts.push(`<p style="font-size:11px;color:#a0928a;text-transform:uppercase;letter-spacing:2px;margin:0 0 10px;font-family:Arial,sans-serif;">Chapter ${idx + 1}</p>`);
        }
        if (memory.scheduled_occasion) {
          parts.push(`<p style="font-size:13px;color:#a0928a;font-style:italic;margin:0 0 12px;font-family:Arial,sans-serif;">Occasion: ${escapeHtml(memory.scheduled_occasion)}</p>`);
        }
        if (memory.title) {
          parts.push(`<h2 style="font-family:Georgia,serif;font-size:20px;color:#3a2a1a;margin:0 0 14px;font-weight:500;">${escapeHtml(memory.title)}</h2>`);
        }
        if (memory.content) {
          parts.push(`<p style="font-size:16px;color:#5a4a3a;line-height:1.7;margin:0 0 14px;font-family:Georgia,serif;font-style:italic;white-space:pre-wrap;">${escapeHtml(memory.content)}</p>`);
        }
        if (mediaLabels[memory.memory_type]) {
          parts.push(`<p style="font-size:13px;color:#a0928a;margin:0;font-family:Arial,sans-serif;">${mediaLabels[memory.memory_type]}</p>`);
        }
        const chapter = `<div style="margin-bottom:${idx < memories.length - 1 ? '28px' : '0'};">${parts.join('')}</div>`;
        if (idx < memories.length - 1) {
          return chapter + `<div style="border-top:1px dashed #e8ddd0;margin:0 0 28px;"></div>`;
        }
        return chapter;
      }).join('');

      const htmlBody = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#faf5f0;">
  <div style="max-width:560px;margin:0 auto;padding:20px;">
    <div style="background:linear-gradient(135deg,#D46A8B,#F3A385);border-radius:16px 16px 0 0;padding:30px 20px;text-align:center;">
      <div style="width:50px;height:50px;background:white;border-radius:50%;line-height:50px;font-size:18px;font-weight:bold;color:#D46A8B;margin:0 auto 12px;font-family:Georgia,serif;">E8</div>
      <h1 style="color:white;font-family:Georgia,serif;margin:0 0 4px;font-size:22px;font-weight:500;">ETERN8</h1>
      <p style="color:rgba(255,255,255,0.85);margin:0;font-size:13px;font-family:Arial,sans-serif;">A message from the heart</p>
    </div>
    <div style="background:#fffdf9;padding:30px 25px;border-radius:0 0 16px 16px;border-left:1px solid #e8ddd0;border-right:1px solid #e8ddd0;border-bottom:1px solid #e8ddd0;">
      <p style="font-size:16px;color:#3a2a1a;margin:0 0 18px;font-family:Georgia,serif;">Dear ${escapeHtml(recipientName)},</p>
      <p style="font-size:16px;color:#3a2a1a;margin:0 0 25px;font-family:Georgia,serif;">${escapeHtml(userName)} has preserved ${memoryCount} special ${memoryCount === 1 ? 'memory' : 'memories'} for you.</p>
      <div style="text-align:center;border-top:1px solid #e8ddd0;border-bottom:1px solid #e8ddd0;padding:14px 0;margin:0 0 25px;">
        <span style="font-family:Georgia,serif;font-size:17px;color:#D46A8B;font-weight:600;">${formattedDate}</span>
      </div>
      ${memoryChapters}
      <div style="text-align:center;border-top:1px solid #e8ddd0;padding-top:20px;margin-top:25px;">
        <p style="font-size:16px;color:#3a2a1a;margin:0 0 4px;font-family:Georgia,serif;">With love,</p>
        <p style="font-family:Georgia,serif;font-style:italic;color:#a0928a;font-size:15px;margin:0;">The ETERN8 Team</p>
      </div>
    </div>
  </div>
</body>
</html>`;

      const subject = memoryCount === 1
        ? `A special message from ${userName}: ${memories[0].title || memories[0].scheduled_occasion || 'A memory for you'}`
        : `${memoryCount} special messages from ${userName} — ${formattedDate}`;

      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: recipientEmail,
          subject,
          body: htmlBody,
          from_name: 'ETERN8',
        });

        // Mark all memories in the group as delivered
        for (const memory of memories) {
          await base44.asServiceRole.entities.Memory.update(memory.id, {
            delivery_status: 'delivered',
            delivered_date: now.toISOString(),
            delivery_attempts: (memory.delivery_attempts || 0) + 1,
            last_attempt_date: now.toISOString(),
            last_delivery_error: null,
          });

          await base44.asServiceRole.entities.LegacyAuditLog.create({
            user_id: memory.created_by_id,
            content_type: 'memory',
            content_id: memory.id,
            event_type: 'memory_delivered',
            details: `Scheduled memory "${memory.title}" delivered to ${recipientName} (${recipientEmail}) as part of a ${memoryCount}-message delivery on ${formattedDate}.`,
          });
        }

        results.push({
          group: groupKey,
          action: 'delivered',
          recipient: recipientName,
          email: recipientEmail,
          date: scheduledDate,
          memory_count: memoryCount,
          memory_titles: memories.map(m => m.title),
        });
      } catch (emailError) {
        const errorMsg = emailError.message || 'Email send failed';

        // Mark all memories with retry tracking
        for (const memory of memories) {
          const attempts = (memory.delivery_attempts || 0) + 1;
          const isLastAttempt = attempts >= MAX_DELIVERY_ATTEMPTS;

          await base44.asServiceRole.entities.Memory.update(memory.id, {
            delivery_attempts: attempts,
            last_attempt_date: now.toISOString(),
            last_delivery_error: errorMsg,
            ...(isLastAttempt ? { delivery_status: 'cancelled' } : {}),
          });

          await base44.asServiceRole.entities.LegacyAuditLog.create({
            user_id: memory.created_by_id,
            content_type: 'memory',
            content_id: memory.id,
            event_type: isLastAttempt ? 'failed_delivery' : 'delivery_retry',
            details: `Failed to deliver "${memory.title}" to ${recipientEmail}: ${errorMsg}. Attempt ${attempts}/${MAX_DELIVERY_ATTEMPTS}.${isLastAttempt ? ' Marked as cancelled.' : ''}`,
          });
        }

        results.push({
          group: groupKey,
          action: 'failed',
          reason: 'email_send_failed',
          error: errorMsg,
          date: scheduledDate,
          memory_count: memoryCount,
        });
      }
    }

    return Response.json({
      processed_at: now.toISOString(),
      total_due: dueMemories.length,
      groups_sent: Object.keys(deliverableGroups).length,
      results,
    });
  } catch (error) {
    console.error('scheduledDeliveryProcessor error:', error);
    return Response.json({ error: 'An internal error occurred' }, { status: 500 });
  }
});