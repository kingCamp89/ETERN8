import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const incoming = await base44.asServiceRole.entities.Friendship.filter({
      to_user_id: user.id,
      status: 'pending',
    });

    const outgoing = await base44.asServiceRole.entities.Friendship.filter({
      from_user_id: user.id,
      status: 'pending',
    });

    return Response.json({ incoming, outgoing });
  } catch (_error) {
    return Response.json({ error: 'Could not load requests' }, { status: 500 });
  }
});