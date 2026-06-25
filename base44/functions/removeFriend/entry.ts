import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { friendId } = await req.json();
    if (!friendId || typeof friendId !== 'string') {
      return Response.json({ error: 'Friend ID is required' }, { status: 400 });
    }

    // Find and delete the friendship
    const friendships = await base44.entities.Friendship.filter({ status: 'accepted' });
    const friendship = friendships.find(
      (f) => (f.from_user_id === user.id && f.to_user_id === friendId) ||
             (f.to_user_id === user.id && f.from_user_id === friendId)
    );

    if (!friendship) {
      return Response.json({ error: 'Friendship not found' }, { status: 404 });
    }

    await base44.entities.Friendship.delete(friendship.id);

    // Revoke all MemoryShare records where this user shared to the friend
    const sentShares = await base44.entities.MemoryShare.filter({
      from_user_id: user.id,
      to_user_id: friendId,
      status: 'accepted',
    });

    await Promise.all(sentShares.map(s => base44.entities.MemoryShare.update(s.id, { status: 'rejected' })));

    // Revoke MemoryShare records received from the friend
    const receivedShares = await base44.entities.MemoryShare.filter({
      from_user_id: friendId,
      to_user_id: user.id,
      status: 'accepted',
    });

    await Promise.all(receivedShares.map(s => base44.entities.MemoryShare.update(s.id, { status: 'rejected' })));

    return Response.json({ success: true, revokedShares: sentShares.length + receivedShares.length });
  } catch (_error) {
    return Response.json({ error: 'Could not remove friend' }, { status: 500 });
  }
});