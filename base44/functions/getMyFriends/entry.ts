import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Find all accepted friendships in both directions
    const sent = await base44.asServiceRole.entities.Friendship.filter({
      from_user_id: user.id,
      status: 'accepted',
    });
    const received = await base44.asServiceRole.entities.Friendship.filter({
      to_user_id: user.id,
      status: 'accepted',
    });

    // Map to friend objects
    const friends = [
      ...sent.map(f => ({
        id: f.to_user_id,
        full_name: f.to_user_name,
        username: f.to_username,
        friendshipId: f.id,
      })),
      ...received.map(f => ({
        id: f.from_user_id,
        full_name: f.from_user_name,
        username: f.from_username,
        friendshipId: f.id,
      })),
    ];

    // Fetch each friend's latest photo_url from User entity
    const friendIds = [...new Set(friends.map(f => f.id))];
    const photoMap = {};
    for (const friendId of friendIds) {
      const users = await base44.asServiceRole.entities.User.filter({ id: friendId });
      if (users.length > 0) {
        photoMap[friendId] = users[0].photo_url || null;
      }
    }

    const friendsWithPhotos = friends.map(f => ({
      ...f,
      photo_url: photoMap[f.id] || null,
    }));

    return Response.json({ friends: friendsWithPhotos });
  } catch (_error) {
    return Response.json({ error: 'Could not load friends' }, { status: 500 });
  }
});