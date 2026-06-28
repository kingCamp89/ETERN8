import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Syncs MemoryShare records for a memory's share_with_ids (friend user IDs).
 * Creates pending shares + notifications for new recipients; revokes removed ones.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { memoryId } = await req.json();
    if (!memoryId) {
      return Response.json({ error: 'memoryId is required' }, { status: 400 });
    }

    const memories = await base44.entities.Memory.filter({ id: memoryId });
    const memory = memories[0];
    if (!memory) {
      return Response.json({ error: 'Memory not found' }, { status: 404 });
    }
    if (memory.created_by_id !== user.id) {
      return Response.json({ error: 'Not authorized' }, { status: 403 });
    }

    const existingShares = await base44.asServiceRole.entities.MemoryShare.filter({
      memory_id: memoryId,
      from_user_id: user.id,
    });

    if (memory.is_private) {
      const revoked: string[] = [];
      for (const share of existingShares) {
        if (share.status !== 'rejected') {
          await base44.asServiceRole.entities.MemoryShare.update(share.id, {
            status: 'rejected',
          });
          revoked.push(share.to_user_id);
        }
      }
      return Response.json({ success: true, created: [], revoked, skipped: [], private: true });
    }

    const targetFriendIds = [...new Set(memory.share_with_ids || [])];

    const sent = await base44.asServiceRole.entities.Friendship.filter({
      from_user_id: user.id,
      status: 'accepted',
    });
    const received = await base44.asServiceRole.entities.Friendship.filter({
      to_user_id: user.id,
      status: 'accepted',
    });
    const friendIds = new Set([
      ...sent.map((f) => f.to_user_id),
      ...received.map((f) => f.from_user_id),
    ]);

    const validFriendIds = targetFriendIds.filter(
      (id) => friendIds.has(id) && id !== user.id,
    );

    const existingByRecipient = new Map(
      existingShares.map((s) => [s.to_user_id, s]),
    );

    const senderName = user.full_name || user.display_name || 'Someone';
    const memoryTitle = memory.title || 'Untitled memory';
    const memoryType = memory.memory_type || 'text';
    const created: string[] = [];
    const revoked: string[] = [];
    const skipped: string[] = [];

    for (const share of existingShares) {
      if (!validFriendIds.includes(share.to_user_id) && share.status !== 'rejected') {
        await base44.asServiceRole.entities.MemoryShare.update(share.id, {
          status: 'rejected',
        });
        revoked.push(share.to_user_id);
      }
    }

    for (const friendId of validFriendIds) {
      const existing = existingByRecipient.get(friendId);

      if (existing) {
        if (existing.status === 'rejected') {
          await base44.asServiceRole.entities.MemoryShare.update(existing.id, {
            status: 'pending',
            memory_title: memoryTitle,
            memory_type: memoryType,
            shared_at: new Date().toISOString(),
          });
          await base44.asServiceRole.entities.Notification.create({
            type: 'share',
            message: `${senderName} shared a memory with you: "${memoryTitle}"`,
            from_user_id: user.id,
            from_user_name: senderName,
            from_user_photo: user.photo_url || '',
            to_user_id: friendId,
            memory_id: memoryId,
            is_read: false,
          });
          created.push(friendId);
        } else {
          if (existing.memory_title !== memoryTitle) {
            await base44.asServiceRole.entities.MemoryShare.update(existing.id, {
              memory_title: memoryTitle,
            });
          }
          skipped.push(friendId);
        }
        continue;
      }

      await base44.asServiceRole.entities.MemoryShare.create({
        memory_id: memoryId,
        memory_title: memoryTitle,
        memory_type: memoryType,
        from_user_id: user.id,
        from_user_name: senderName,
        to_user_id: friendId,
        status: 'pending',
        shared_at: new Date().toISOString(),
      });

      await base44.asServiceRole.entities.Notification.create({
        type: 'share',
        message: `${senderName} shared a memory with you: "${memoryTitle}"`,
        from_user_id: user.id,
        from_user_name: senderName,
        from_user_photo: user.photo_url || '',
        to_user_id: friendId,
        memory_id: memoryId,
        is_read: false,
      });

      created.push(friendId);
    }

    return Response.json({ success: true, created, revoked, skipped });
  } catch (_error) {
    return Response.json({ error: 'Could not share memory' }, { status: 500 });
  }
});
