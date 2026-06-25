import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Returns ONLY groups the authenticated user owns or is a member of.
 * Uses two targeted array-contains queries — no broad list-then-filter.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Query 1: groups the user created
    const ownedGroups = await base44.asServiceRole.entities.MemoryGroup.filter(
      { created_by_id: user.id },
      '-updated_date',
      50,
    );

    // Query 2: groups where user appears in member_ids (array-contains)
    const memberGroups = await base44.asServiceRole.entities.MemoryGroup.filter(
      { member_ids: user.id },
      '-updated_date',
      50,
    );

    // Merge and deduplicate
    const seen = new Set();
    const allGroups = [];

    for (const g of [...ownedGroups, ...memberGroups]) {
      if (!seen.has(g.id)) {
        seen.add(g.id);
        allGroups.push(g);
      }
    }

    // Sort by updated_date descending
    allGroups.sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date));

    // Enrich member photos from User entity
    await Promise.all(
      allGroups.map(async (group) => {
        const memberIds = group.member_ids || [];
        if (!memberIds.length) return;

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
      }),
    );

    return Response.json({ groups: allGroups });
  } catch (_error) {
    return Response.json({ error: 'Could not load groups' }, { status: 500 });
  }
});