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

    // Fetch ONLY this group by exact ID
    const groups = await base44.asServiceRole.entities.MemoryGroup.filter({ id: groupId });
    const group = groups[0];

    if (!group) {
      return Response.json({ error: 'Group not found' }, { status: 404 });
    }

    // Membership check — deny non-members entirely (private app)
    const isMember = group.created_by_id === user.id || (group.member_ids || []).includes(user.id);
    if (!isMember) {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    // Enrich member data from User entity
    const memberIds = group.member_ids || [];
    if (memberIds.length) {
      const enrichedPhotos = Array.from(group.member_photos || []);
      const enrichedNames = Array.from(group.member_names || []);

      await Promise.all(
        memberIds.map(async (memberId, i) => {
          try {
            const users = await base44.asServiceRole.entities.User.filter({ id: memberId });
            const u = users?.[0];
            if (u) {
              if (u.photo_url) enrichedPhotos[i] = u.photo_url;
              const name = u.display_name || u.full_name;
              if (name) enrichedNames[i] = name;
            }
          } catch (_e) {}
        }),
      );

      group.member_photos = enrichedPhotos;
      group.member_names = enrichedNames;
    }

    return Response.json({ group });
  } catch (_error) {
    return Response.json({ error: 'Could not load group details' }, { status: 500 });
  }
});