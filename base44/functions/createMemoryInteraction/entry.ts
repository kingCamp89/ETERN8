import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { memoryId, type, content } = await req.json();

    if (!memoryId || !type) {
      return Response.json({ error: 'memoryId and type are required' }, { status: 400 });
    }

    if (!['like', 'comment'].includes(type)) {
      return Response.json({ error: 'Invalid interaction type' }, { status: 400 });
    }

    if (type === 'comment' && (!content || typeof content !== 'string' || content.trim().length === 0)) {
      return Response.json({ error: 'Comment content is required' }, { status: 400 });
    }

    // Check if the user can access this memory
    const ownMemories = await base44.entities.Memory.filter({ id: memoryId });
    if (ownMemories.length) {
      // Owner can always interact
      const interaction = await base44.entities.MemoryInteraction.create({
        memory_id: memoryId,
        user_name: user.full_name || 'Someone',
        user_photo: user.photo_url || '',
        type,
        content: type === 'comment' ? content : undefined,
      });
      return Response.json({ interaction });
    }

    // Not the owner — check if shared via MemoryShare
    const shares = await base44.entities.MemoryShare.filter({
      memory_id: memoryId,
      to_user_id: user.id,
      status: 'accepted',
    });

    if (shares.length) {
      const interaction = await base44.entities.MemoryInteraction.create({
        memory_id: memoryId,
        user_name: user.full_name || 'Someone',
        user_photo: user.photo_url || '',
        type,
        content: type === 'comment' ? content : undefined,
      });
      return Response.json({ interaction });
    }

    return Response.json({ error: 'You do not have access to this memory' }, { status: 403 });
  } catch (_error) {
    return Response.json({ error: 'Could not create interaction' }, { status: 500 });
  }
});