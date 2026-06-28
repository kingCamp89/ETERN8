import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Permission model — checked in order, fails closed:
 *   1. Owner (created_by_id === user.id) — user-scoped query
 *   2. Direct share (MemoryShare, status: accepted) — user-scoped query
 *   3. Group share (user is member of a shared group) — exact ID queries only
 *
 * No broad list queries anywhere. Every step fetches only the needed record.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { memoryId } = await req.json();
    if (!memoryId) {
      return Response.json({ error: 'memoryId is required' }, { status: 400 });
    }

    // ── Check 1: Owner access (user-scoped, hits only this memory) ──
    const ownMemories = await base44.entities.Memory.filter({ id: memoryId });
    if (ownMemories.length) {
      return Response.json({ memory: ownMemories[0] });
    }

    // ── Check 2: Direct share (user-scoped MemoryShare, scoped by ID + user) ──
    // Allow pending shares too — recipients should be able to preview before accepting.
    const shares = await base44.entities.MemoryShare.filter({
      memory_id: memoryId,
      to_user_id: user.id,
    });
    const activeShare = shares.find((s) => s.status === 'accepted' || s.status === 'pending' || s.status === 'tagged');

    // ── Fetch the memory once via service-role for remaining checks ──
    const allMemories = await base44.asServiceRole.entities.Memory.filter({ id: memoryId });
    const memory = allMemories[0];

    if (!memory) {
      return Response.json({ error: 'Memory not found' }, { status: 404 });
    }

    if (memory.is_private && memory.created_by_id !== user.id) {
      return Response.json({ error: 'Memory not found or access denied' }, { status: 404 });
    }

    // Direct share access confirmed (pending, accepted, or tagged)
    if (activeShare) {
      return Response.json({ memory });
    }

    // ── Check 3: Group share — verify membership via targeted queries ──
    if (memory.share_group_ids?.length) {
      let hasGroupAccess = false;

      for (const groupId of memory.share_group_ids) {
        // Check if user created this group (exact ID query)
        const owned = await base44.asServiceRole.entities.MemoryGroup.filter({
          id: groupId,
          created_by_id: user.id,
        });
        if (owned.length) {
          hasGroupAccess = true;
          break;
        }

        // Check if user is a member (array-contains filter on member_ids)
        const memberOf = await base44.asServiceRole.entities.MemoryGroup.filter({
          id: groupId,
          member_ids: user.id,
        });
        if (memberOf.length) {
          hasGroupAccess = true;
          break;
        }
      }

      if (hasGroupAccess) {
        return Response.json({ memory });
      }
    }

    // ── Fail closed ──
    return Response.json({ error: 'Memory not found or access denied' }, { status: 404 });
  } catch (_error) {
    return Response.json({ error: 'Could not load memory' }, { status: 500 });
  }
});