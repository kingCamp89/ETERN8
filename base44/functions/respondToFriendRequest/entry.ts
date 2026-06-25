import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { friendshipId, action } = await req.json();

    if (!friendshipId || typeof friendshipId !== 'string') {
      return Response.json({ error: 'Missing friendshipId' }, { status: 400 });
    }

    if (!action || !['accepted', 'rejected'].includes(action)) {
      return Response.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Use service role — Friendship RLS only allows the sender (created_by_id) to read/update,
    // but the recipient needs to respond. We verify ownership via to_user_id below.
    const friendships = await base44.asServiceRole.entities.Friendship.filter({
      to_user_id: user.id,
      status: 'pending',
    });

    const friendship = friendships.find(f => f.id === friendshipId);

    if (!friendship) {
      return Response.json({ error: 'Friendship not found or not authorized' }, { status: 404 });
    }

    await base44.asServiceRole.entities.Friendship.update(friendshipId, { status: action });

    return Response.json({ success: true, status: action });
  } catch (_error) {
    return Response.json({ error: 'Could not respond to request' }, { status: 500 });
  }
});