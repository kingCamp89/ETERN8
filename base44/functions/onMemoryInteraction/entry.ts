import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { requireInternalSecret, stripInternalSecret } from '../_shared/internalAuth.ts';

/**
 * Legacy webhook handler for MemoryInteraction entity events.
 * Notifications are created by createMemoryInteraction; this endpoint is
 * internal-only so unauthenticated callers cannot forge notifications.
 */
Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const authError = requireInternalSecret(req, body);
    if (authError) return authError;

    const base44 = createClientFromRequest(req);
    const payload = stripInternalSecret(body);
    const interaction = payload.data;

    if (!interaction || !interaction.memory_id) {
      return Response.json({ skipped: 'no memory_id' });
    }

    const memories = await base44.asServiceRole.entities.Memory.filter({ id: interaction.memory_id });
    const memory = memories[0];

    if (!memory) {
      return Response.json({ skipped: 'memory not found' });
    }

    const interactionCreator = interaction.created_by_id;
    const memoryOwner = memory.created_by_id;

    if (interactionCreator === memoryOwner) {
      return Response.json({ skipped: 'own memory' });
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
      return Response.json({ skipped: 'unknown type' });
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

    return Response.json({ success: true });
  } catch (_error) {
    return Response.json({ error: 'Could not process interaction' }, { status: 500 });
  }
});
