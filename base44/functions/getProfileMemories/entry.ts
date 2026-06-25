import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { lovedOneId, type, cursor, limit = 20 } = await req.json();
    if (!lovedOneId) {
      return Response.json({ error: 'lovedOneId is required' }, { status: 400 });
    }

    // Build query — always scoped to the current user
    const query = { created_by_id: user.id, loved_one_id: lovedOneId };
    if (type && type !== 'all') {
      query.memory_type = type;
    }

    // Fetch paginated memories sorted by memory_date descending
    const memories = await base44.entities.Memory.filter(
      query,
      '-memory_date',
      limit,
      cursor ? parseInt(cursor) : 0
    );

    const nextCursor = memories.length === limit
      ? ((cursor ? parseInt(cursor) : 0) + limit).toString()
      : null;

    // Year grouping
    const grouped = {};
    const typeCounts = { text: 0, photo: 0, voice: 0, video: 0 };
    const yearSet = new Set();

    for (const m of memories) {
      if (typeCounts[m.memory_type] !== undefined) {
        typeCounts[m.memory_type]++;
      }
      const year = m.memory_date
        ? new Date(m.memory_date).getFullYear()
        : new Date(m.created_date).getFullYear();
      yearSet.add(year);
      if (!grouped[year]) grouped[year] = [];
      grouped[year].push(m);
    }

    return Response.json({
      memories,
      grouped,
      sortedYears: Object.keys(grouped).sort((a, b) => b - a),
      nextCursor,
      typeCounts,
      totalYears: yearSet.size,
      total: memories.length,
    });
  } catch (_error) {
    return Response.json({ error: 'Could not load memories' }, { status: 500 });
  }
});