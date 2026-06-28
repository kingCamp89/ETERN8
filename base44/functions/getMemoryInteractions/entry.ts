import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Returns all interactions for a memory.
 * Uses service role to bypass the MemoryInteraction RLS (which only lets the
 * interaction creator read their own rows). Access is still gated — the caller
 * must be the memory owner OR have an accepted MemoryShare for that memory.
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

    // ── Check access ──────────────────────────────────────────────────────────
    // 1. Owner: direct RLS-scoped filter (only returns the memory if owned by user)
    const ownMemories = await base44.entities.Memory.filter({ id: memoryId });
    const isOwner = ownMemories.length > 0;

    if (!isOwner) {
      // 2. Accepted share
      const shares = await base44.entities.MemoryShare.filter({
        memory_id: memoryId,
        to_user_id: user.id,
      });
      const hasAccess = shares.some(
        (s) => s.status === 'accepted' || s.status === 'pending' || s.status === 'tagged',
      );
      if (!hasAccess) {
        return Response.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // ── Fetch all interactions via service role (bypasses created_by RLS) ─────
    const interactions = await base44.asServiceRole.entities.MemoryInteraction.filter(
      { memory_id: memoryId },
      '-created_date',
      200,
    );

    return Response.json({ interactions });
  } catch (_error) {
    return Response.json({ error: 'Could not fetch interactions' }, { status: 500 });
  }
});
