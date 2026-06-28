import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

async function notifyMemoryOwner(base44, interaction, memory) {
  const interactionCreator = interaction.created_by_id;
  const memoryOwner = memory.created_by_id;

  if (!interactionCreator || interactionCreator === memoryOwner) {
    return;
  }

  const interactionType = interaction.type;
  const userName = interaction.user_name || 'Someone';
  const memoryTitle = memory.title || 'your memory';

  let message;
  if (interactionType === 'like') {
    message = `${userName} liked your memory "${memoryTitle}"`;
  } else if (interactionType === 'comment') {
    const snippet = (interaction.content || '').slice(0, 60);
    message = `${userName} commented on "${memoryTitle}": "${snippet}${snippet.length >= 60 ? '...' : ''}"`;
  } else {
    return;
  }

  await base44.asServiceRole.entities.Notification.create({
    type: interactionType,
    message,
    from_user_id: interactionCreator,
    from_user_name: userName,
    from_user_photo: interaction.user_photo || '',
    to_user_id: memoryOwner,
    memory_id: interaction.memory_id,
    is_read: false,
  });
}

async function createInteraction(base44, user, memoryId, type, content) {
  return base44.asServiceRole.entities.MemoryInteraction.create({
    memory_id: memoryId,
    user_name: user.full_name || 'Someone',
    user_photo: user.photo_url || '',
    type,
    content: type === 'comment' ? content : undefined,
    created_by_id: user.id,
  });
}

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

    const ownMemories = await base44.entities.Memory.filter({ id: memoryId });
    if (ownMemories.length) {
      const interaction = await createInteraction(base44, user, memoryId, type, content);
      await notifyMemoryOwner(base44, interaction, ownMemories[0]);
      return Response.json({ interaction });
    }

    const shares = await base44.entities.MemoryShare.filter({
      memory_id: memoryId,
      to_user_id: user.id,
      status: 'accepted',
    });

    if (shares.length) {
      const memories = await base44.asServiceRole.entities.Memory.filter({ id: memoryId });
      const memory = memories[0];
      if (!memory) {
        return Response.json({ error: 'Memory not found' }, { status: 404 });
      }

      const interaction = await createInteraction(base44, user, memoryId, type, content);
      await notifyMemoryOwner(base44, interaction, memory);
      return Response.json({ interaction });
    }

    return Response.json({ error: 'You do not have access to this memory' }, { status: 403 });
  } catch (_error) {
    return Response.json({ error: 'Could not create interaction' }, { status: 500 });
  }
});
