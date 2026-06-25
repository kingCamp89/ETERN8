import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    // Check user-scoped
    const userGroups = await base44.entities.MemoryGroup.list('-updated_date', 10);

    // Check service-role across different entities with various query methods
    const [groupsSR, groupsFilterSR, memoriesSR, friendshipsSR, lovedOnesSR] = await Promise.all([
      base44.asServiceRole.entities.MemoryGroup.list(null, 100),
      base44.asServiceRole.entities.MemoryGroup.filter({}),
      base44.asServiceRole.entities.Memory.list(null, 10),
      base44.asServiceRole.entities.Friendship.list(null, 10),
      base44.asServiceRole.entities.LovedOne.list(null, 10),
    ]);

    // Inspect first service-role group's structure
    return Response.json({
      userId: user.id,
      userScopedGroups: userGroups.length,
      serviceRoleGroups: groupsSR.length,
      serviceRoleGroupsFilter: groupsFilterSR.length,
      serviceRoleMemories: memoriesSR.length,
      serviceRoleFriendships: friendshipsSR.length,
      serviceRoleLovedOnes: lovedOnesSR.length,
    });
  } catch (_error) {
    return Response.json({ error: 'Debug endpoint error' }, { status: 500 });
  }
});