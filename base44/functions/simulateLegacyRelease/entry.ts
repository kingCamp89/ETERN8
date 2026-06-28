import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const COOLING_OFF_DAYS = 14;
const QUORUM_REQUIRED = 2;

/**
 * Release Simulation Mode — admin/test only.
 * Simulates the entire legacy release process WITHOUT releasing real content
 * or sending real emails. Returns a report of what would happen at each stage.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { target_user_id } = body;

    if (!target_user_id) {
      return Response.json({ error: 'Missing target_user_id' }, { status: 400 });
    }

    // Fetch target user
    const users = await base44.asServiceRole.entities.User.list();
    const targetUser = users.find(u => u.id === target_user_id);
    if (!targetUser) {
      return Response.json({ error: 'Target user not found' }, { status: 404 });
    }

    const now = new Date();
    const report = {
      simulated_at: now.toISOString(),
      target_user: targetUser.full_name || targetUser.email,
      stages: [],
      validation: null,
      would_release: [],
      total_would_release: 0,
      total_recipients: 0,
    };

    // ── Simulate inactivity ──
    const waitMonths = targetUser.legacy_wait_months || 3;
    report.stages.push({
      stage: 'inactivity_detected',
      description: `Simulated ${waitMonths} months of inactivity`,
      last_activity: targetUser.legacy_activity_timestamp || targetUser.last_checkin_date || 'unknown',
      would_trigger: true,
    });

    // ── Simulate contact confirmations ──
    const verifiedContacts = await base44.asServiceRole.entities.TrustedContact.filter({
      created_by_id: target_user_id,
      verification_status: 'verified',
    });
    report.stages.push({
      stage: 'contact_confirmations',
      verified_contacts: verifiedContacts.length,
      would_reach_quorum: verifiedContacts.length >= QUORUM_REQUIRED,
      contacts: verifiedContacts.map(c => ({ name: c.name, email: c.email })),
    });

    // ── Simulate executor approval ──
    const executors = await base44.asServiceRole.entities.Executor.filter({
      user_id: target_user_id,
      verification_status: 'verified',
    });
    report.stages.push({
      stage: 'executor_approval',
      verified_executor: executors.length > 0,
      executor: executors[0] ? { name: executors[0].full_name, email: executors[0].email } : null,
      would_approve: executors.length > 0,
    });

    // ── Simulate cooling-off expiry ──
    const coolingOffEnd = new Date(now.getTime() + COOLING_OFF_DAYS * 24 * 60 * 60 * 1000);
    report.stages.push({
      stage: 'cooling_off',
      would_start: now.toISOString(),
      would_end: coolingOffEnd.toISOString(),
      would_expire: true,
    });

    // ── Simulate validation ──
    const validationReasons = [];
    if (verifiedContacts.length < QUORUM_REQUIRED) {
      validationReasons.push(`Only ${verifiedContacts.length}/${QUORUM_REQUIRED} verified contacts`);
    }
    if (executors.length === 0) {
      validationReasons.push('No verified executor');
    }

    report.validation = {
      protocol_status: 'approved_for_release (simulated)',
      quorum_met: verifiedContacts.length >= QUORUM_REQUIRED,
      executor_approved: executors.length > 0,
      cooling_off_expired: true,
      no_pause: true,
      no_cancellation: true,
      no_recent_activity: true,
      would_pass: validationReasons.length === 0,
      failure_reasons: validationReasons,
    };

    // ── Simulate what would be released (recipient isolation) ──
    const allMemories = await base44.asServiceRole.entities.Memory.filter({
      created_by_id: target_user_id,
    });
    const allNotes = await base44.asServiceRole.entities.PrivateNote.filter({
      created_by_id: target_user_id,
    });

    const undelivered = allMemories.filter(m =>
      m.delivery_status !== 'delivered' && m.delivery_status !== 'cancelled' && !m.is_private
    );

    // Group by recipient using strict ID matching only
    const byRecipient = {};
    for (const mem of undelivered) {
      const recipients = mem.recipient_ids?.length ? mem.recipient_ids : [];
      if (recipients.length === 0 && mem.loved_one_id) {
        recipients.push(mem.loved_one_id);
      }
      for (const rid of recipients) {
        if (!byRecipient[rid]) byRecipient[rid] = { memories: [], notes: [] };
        byRecipient[rid].memories.push({ title: mem.title, type: mem.memory_type, delivery_status: mem.delivery_status });
      }
    }

    // Add private notes
    for (const note of allNotes) {
      const rid = note.subject_friend_id;
      if (rid) {
        if (!byRecipient[rid]) byRecipient[rid] = { memories: [], notes: [] };
        byRecipient[rid].notes.push({ title: note.title });
      }
    }

    for (const [rid, items] of Object.entries(byRecipient)) {
      const contact = verifiedContacts.find(c => c.id === rid);
      const executor = executors.find(e => e.id === rid);
      const recipientName = contact?.name || executor?.full_name || rid;

      // Count by content type
      const typeCounts = {};
      for (const mem of items.memories) {
        const type = mem.type || 'text';
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      }

      report.would_release.push({
        recipient_id: rid,
        recipient_name: recipientName,
        memory_count: items.memories.length,
        note_count: items.notes.length,
        content_breakdown: {
          text: typeCounts.text || 0,
          photo: typeCounts.photo || 0,
          voice: typeCounts.voice || 0,
          video: typeCounts.video || 0,
          notes: items.notes.length,
        },
        items: items,
      });
    }

    report.total_would_release = undelivered.length + allNotes.length;
    report.total_recipients = Object.keys(byRecipient).length;

    // Audit the simulation
    try {
      await base44.asServiceRole.entities.LegacyAuditLog.create({
        user_id: target_user_id,
        event_type: 'simulation_run',
        details: `Release simulation run by admin ${user.full_name}. Would release ${report.total_would_release} items to ${report.total_recipients} recipient(s). Validation would ${report.validation.would_pass ? 'PASS' : 'FAIL'}.`,
      });
    } catch (e) {
      console.error('Failed to log simulation:', e.message);
    }

    return Response.json(report);
  } catch (error) {
    console.error('simulateLegacyRelease error:', error);
    return Response.json({ error: 'An internal error occurred' }, { status: 500 });
  }
});