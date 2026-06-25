import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * validateRecipientOwnership — ensures each recipient only receives content
 * explicitly assigned to them. Prevents cross-recipient content leakage.
 *
 * Rules:
 *   Memory may only be released if:
 *     - recipient_ids contains recipient_id
 *     OR
 *     - loved_one_id matches recipient_id
 *
 * Private notes may only be released if:
 *   - subject_friend_id matches recipient_id
 *
 * Any mismatch is logged and the content is skipped.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { user_id, recipient_id, memories, notes } = body;

    if (!user_id || !recipient_id) {
      return Response.json({ valid: false, reason: 'Missing user_id or recipient_id' }, { status: 400 });
    }

    const validMemories = [];
    const rejectedMemories = [];

    for (const mem of (memories || [])) {
      const inRecipientIds = mem.recipient_ids && mem.recipient_ids.includes(recipient_id);
      const lovedOneMatch = mem.loved_one_id && mem.loved_one_id === recipient_id;

      if (inRecipientIds || lovedOneMatch) {
        validMemories.push(mem);
      } else {
        rejectedMemories.push({
          memory_id: mem.id,
          title: mem.title,
          reason: 'Recipient not in recipient_ids and loved_one_id does not match',
        });

        // Log the validation failure
        try {
          await base44.asServiceRole.entities.LegacyAuditLog.create({
            user_id,
            content_type: 'memory',
            content_id: mem.id,
            event_type: 'recipient_validation_failed',
            details: `Memory "${mem.title}" (${mem.id}) rejected for recipient ${recipient_id} — no ownership match. Content NOT released.`,
          });
        } catch (e) {
          console.error('Failed to log recipient validation failure:', e.message);
        }
      }
    }

    const validNotes = [];
    const rejectedNotes = [];

    for (const note of (notes || [])) {
      if (note.subject_friend_id && note.subject_friend_id === recipient_id) {
        validNotes.push(note);
      } else {
        rejectedNotes.push({
          note_id: note.id,
          title: note.title,
          reason: 'subject_friend_id does not match recipient',
        });

        try {
          await base44.asServiceRole.entities.LegacyAuditLog.create({
            user_id,
            content_type: 'private_note',
            content_id: note.id,
            event_type: 'recipient_validation_failed',
            details: `Private note "${note.title}" (${note.id}) rejected for recipient ${recipient_id} — subject_friend_id mismatch. Content NOT released.`,
          });
        } catch (e) {
          console.error('Failed to log note validation failure:', e.message);
        }
      }
    }

    // Log success
    if (validMemories.length > 0 || validNotes.length > 0) {
      try {
        await base44.asServiceRole.entities.LegacyAuditLog.create({
          user_id,
          event_type: 'recipient_validation_passed',
          details: `Recipient ${recipient_id}: ${validMemories.length} memories and ${validNotes.length} notes validated. ${rejectedMemories.length} memories and ${rejectedNotes.length} notes rejected.`,
        });
      } catch (e) {
        console.error('Failed to log recipient validation success:', e.message);
      }
    }

    return Response.json({
      valid: true,
      recipient_id,
      valid_memories: validMemories,
      valid_notes: validNotes,
      rejected_memories: rejectedMemories,
      rejected_notes: rejectedNotes,
    });
  } catch (error) {
    console.error('validateRecipientOwnership error:', error);
    return Response.json({ valid: false, reason: 'Internal error: ' + error.message }, { status: 500 });
  }
});