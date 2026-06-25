import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * validateContentEligibility — determines which content is eligible for
 * legacy release. Content is eligible only if:
 *
 *   1. delivery_status is NOT: delivered, cancelled, or legacy_released
 *   2. Content belongs to the deceased user (created_by_id matches)
 *   3. Content has an intended recipient (recipient_ids or loved_one_id)
 *
 * Returns eligible memories and notes, plus rejected items with reasons.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { user_id } = body;

    if (!user_id) {
      return Response.json({ valid: false, reason: 'Missing user_id' }, { status: 400 });
    }

    // Fetch all memories for the user
    const allMemories = await base44.asServiceRole.entities.Memory.filter({
      created_by_id: user_id,
    });

    const eligibleMemories = [];
    const rejectedMemories = [];

    for (const mem of allMemories) {
      // Rule 1: delivery_status must not be delivered, cancelled, or legacy_released
      if (['delivered', 'cancelled', 'legacy_released'].includes(mem.delivery_status)) {
        rejectedMemories.push({
          memory_id: mem.id,
          title: mem.title,
          reason: `delivery_status is "${mem.delivery_status}"`,
        });
        continue;
      }

      // Rule 2: Content must belong to the user (already filtered by created_by_id, but double-check)
      if (mem.created_by_id !== user_id) {
        rejectedMemories.push({
          memory_id: mem.id,
          title: mem.title,
          reason: 'Content does not belong to this user',
        });
        continue;
      }

      // Rule 3: Content must have an intended recipient
      const hasRecipientIds = mem.recipient_ids && mem.recipient_ids.length > 0;
      const hasLovedOneId = !!mem.loved_one_id;

      if (!hasRecipientIds && !hasLovedOneId) {
        rejectedMemories.push({
          memory_id: mem.id,
          title: mem.title,
          reason: 'No intended recipient (no recipient_ids and no loved_one_id)',
        });
        continue;
      }

      eligibleMemories.push(mem);
    }

    // Fetch all private notes for the user
    const allNotes = await base44.asServiceRole.entities.PrivateNote.filter({
      created_by_id: user_id,
    });

    const eligibleNotes = [];
    const rejectedNotes = [];

    for (const note of allNotes) {
      // Private notes must have a subject_friend_id (intended recipient)
      if (!note.subject_friend_id) {
        rejectedNotes.push({
          note_id: note.id,
          title: note.title,
          reason: 'No subject_friend_id (no intended recipient)',
        });
        continue;
      }

      eligibleNotes.push(note);
    }

    // Audit the eligibility check
    try {
      await base44.asServiceRole.entities.LegacyAuditLog.create({
        user_id,
        event_type: 'release_validation_passed',
        details: `Content eligibility check: ${eligibleMemories.length} eligible memories, ${eligibleNotes.length} eligible notes. ${rejectedMemories.length} memories and ${rejectedNotes.length} notes rejected.`,
      });
    } catch (e) {
      console.error('Failed to log eligibility check:', e.message);
    }

    return Response.json({
      valid: true,
      eligible_memories: eligibleMemories,
      eligible_notes: eligibleNotes,
      rejected_memories: rejectedMemories,
      rejected_notes: rejectedNotes,
    });
  } catch (error) {
    console.error('validateContentEligibility error:', error);
    return Response.json({ valid: false, reason: 'Internal error: ' + error.message }, { status: 500 });
  }
});