import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'You must be logged in' }, { status: 401 });
    }

    const { groupId, memberIds, memberNames, memberPhotos } = await req.json();

    if (!groupId || typeof groupId !== 'string') {
      return Response.json({ error: 'Group ID is required' }, { status: 400 });
    }

    if (!memberIds || !Array.isArray(memberIds) || !memberIds.length) {
      return Response.json({ error: 'At least one member ID is required' }, { status: 400 });
    }

    // Fetch group via user scope — only the creator can update it
    const groups = await base44.entities.MemoryGroup.filter({ id: groupId });
    if (!groups.length) {
      return Response.json({ error: 'Group not found or you do not have access' }, { status: 404 });
    }

    const group = groups[0];

    if (group.created_by_id !== user.id) {
      return Response.json({ error: 'Only the group creator can add members' }, { status: 403 });
    }

    const currentMemberIds = [...(group.member_ids || [])];
    const currentMemberNames = [...(group.member_names || [])];
    const currentMemberPhotos = [...(group.member_photos || [])];

    memberIds.forEach((id, i) => {
      if (typeof id !== 'string') return;
      if (!currentMemberIds.includes(id)) {
        currentMemberIds.push(id);
        currentMemberNames.push(typeof memberNames?.[i] === 'string' ? memberNames[i] : '');
        currentMemberPhotos.push(typeof memberPhotos?.[i] === 'string' ? memberPhotos[i] : '');
      }
    });

    await base44.entities.MemoryGroup.update(groupId, {
      member_ids: currentMemberIds,
      member_names: currentMemberNames,
      member_photos: currentMemberPhotos,
    });

    return Response.json({ success: true });
  } catch (_error) {
    return Response.json({ error: 'Could not add members' }, { status: 500 });
  }
});