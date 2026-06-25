import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { toUserId } = await req.json();

    if (!toUserId || typeof toUserId !== 'string') {
      return Response.json({ error: 'Missing toUserId' }, { status: 400 });
    }
    if (toUserId === user.id) {
      return Response.json({ error: 'Cannot send request to yourself' }, { status: 400 });
    }

    // Check if friendship already exists in either direction
    const existing = await base44.entities.Friendship.filter({
      from_user_id: user.id,
      to_user_id: toUserId,
    });
    if (existing.length > 0) {
      return Response.json({ friendship: existing[0], alreadyExists: true });
    }

    const reverse = await base44.entities.Friendship.filter({
      from_user_id: toUserId,
      to_user_id: user.id,
    });
    if (reverse.length > 0) {
      return Response.json({ friendship: reverse[0], alreadyExists: true });
    }

    // Verify target user exists
    const targetUser = await base44.entities.User.filter({ id: toUserId });
    const target = targetUser[0];
    if (!target) return Response.json({ error: 'User not found' }, { status: 404 });

    const friendship = await base44.entities.Friendship.create({
      from_user_id: user.id,
      from_user_name: user.full_name || '',
      from_username: user.username || '',
      to_user_id: toUserId,
      to_user_name: target.full_name || '',
      to_username: target.username || '',
      status: 'pending',
    });

    return Response.json({ friendship });
  } catch (_error) {
    return Response.json({ error: 'Could not send friend request' }, { status: 500 });
  }
});