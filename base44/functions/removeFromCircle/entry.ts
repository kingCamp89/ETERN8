import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'You must be logged in' }, { status: 401 });
    }

    const { groupId, memberId } = await req.json();

    if (!groupId || typeof groupId !== 'string' || !memberId || typeof memberId !== 'string') {
      return Response.json({ error: 'Group ID and Member ID are required' }, { status: 400 });
    }

    // Fetch group via user scope
    const groups = await base44.entities.MemoryGroup.filter({ id: groupId });
    if (!groups.length) {
      return Response.json({ error: 'Group not found or you do not have access' }, { status: 404 });
    }

    const group = groups[0];

    const isCreator = group.created_by_id === user.id;
    const isSelf = memberId === user.id;

    if (!isCreator && !isSelf) {
      return Response.json({ error: 'Only the group creator can remove other members' }, { status: 403 });
    }

    const removeIndex = (group.member_ids || []).indexOf(memberId);
    if (removeIndex === -1) {
      return Response.json({ error: 'Member not found' }, { status: 404 });
    }

    const memberIds = [...group.member_ids];
    const memberNames = [...(group.member_names || [])];
    const memberPhotos = [...(group.member_photos || [])];

    memberIds.splice(removeIndex, 1);
    memberNames.splice(removeIndex, 1);
    memberPhotos.splice(removeIndex, 1);

    // Creator updates — uses user-scoped update (creator has permission)
    await base44.entities.MemoryGroup.update(groupId, {
      member_ids: memberIds,
      member_names: memberNames,
      member_photos: memberPhotos,
    });

    return Response.json({ success: true });
  } catch (_error) {
    return Response.json({ error: 'Could not remove member' }, { status: 500 });
  }
});