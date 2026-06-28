import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { event_type, content_type, content_id, details } = body;

    if (!event_type || typeof event_type !== 'string') {
      return Response.json({ error: 'event_type is required' }, { status: 400 });
    }

    if (!content_type || typeof content_type !== 'string') {
      return Response.json({ error: 'content_type is required' }, { status: 400 });
    }

    const validEventTypes = [
      'legacy_enabled', 'legacy_disabled', 'check_in', 'inactivity_detected',
      'notification_sent', 'reminder_sent', 'user_emailed',
      'confirmation_received_alive', 'confirmation_received_passed',
      'cooling_off_started', 'cooling_off_cancelled', 'memories_released',
      'content_viewed', 'content_edited', 'content_shared', 'content_deleted',
      'access_denied',
    ];

    const validContentTypes = ['memory', 'private_note', 'group', 'memory_share'];

    if (!validEventTypes.includes(event_type)) {
      return Response.json({ error: 'Invalid event_type' }, { status: 400 });
    }

    if (!validContentTypes.includes(content_type)) {
      return Response.json({ error: 'Invalid content_type' }, { status: 400 });
    }

    await base44.asServiceRole.entities.LegacyAuditLog.create({
      user_id: user.id,
      event_type,
      content_type,
      content_id: content_id || null,
      details: typeof details === 'string' ? details : `${event_type} on ${content_type}`,
    });

    return Response.json({ success: true });
  } catch (_error) {
    return Response.json({ error: 'Could not log access' }, { status: 500 });
  }
});