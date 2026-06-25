import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { groupId } = await req.json();
    if (!groupId) {
      return Response.json({ error: 'groupId is required' }, { status: 400 });
    }

    // Step 1: Fetch group by exact ID
    const groups = await base44.asServiceRole.entities.MemoryGroup.filter({ id: groupId });
    if (!groups.length) {
      return Response.json({ error: 'Group not found' }, { status: 404 });
    }

    const group = groups[0];

    // Step 2: Membership check — deny non-members before touching any Memory data
    const isMember = group.created_by_id === user.id || (group.member_ids || []).includes(user.id);
    if (!isMember) {
      return Response.json({ error: 'Not a member of this group' }, { status: 403 });
    }

    // Step 3: Fetch ONLY memories shared with this exact group (array-contains filter)
    const groupMemories = await base44.asServiceRole.entities.Memory.filter(
      { share_group_ids: groupId },
      '-created_date',
      100,
    );

    return Response.json({ memories: groupMemories });
  } catch (_error) {
    return Response.json({ error: 'Could not load group memories' }, { status: 500 });
  }
});