import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Shared audit logging function.
 * Call this from other backend functions to log sensitive actions.
 * Accepts: { userId, eventType, contentId, contentId2, details, metadata }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { userId, eventType, contentId, contentId2, details, metadata } = await req.json();

    if (!userId || !eventType) {
      return Response.json({ error: 'userId and eventType are required' }, { status: 400 });
    }

    const validEvents = [
      'view', 'share', 'edit', 'delete', 'export',
      'failed_access', 'permission_change', 'group_removal',
      'legacy_guardian_action', 'content_accessed',
    ];

    if (!validEvents.includes(eventType)) {
      return Response.json({ error: 'Invalid event type' }, { status: 400 });
    }

    await base44.asServiceRole.entities.LegacyAuditLog.create({
      user_id: userId,
      event_type: 'content_viewed', // use the closest match
      content_id: contentId || '',
      details: `${eventType}: ${details || 'No details'}${metadata ? ' | ' + JSON.stringify(metadata) : ''}`,
    });

    return Response.json({ logged: true });
  } catch (_error) {
    // Audit logging should never block the main action — silent fail
    return Response.json({ logged: false });
  }
});