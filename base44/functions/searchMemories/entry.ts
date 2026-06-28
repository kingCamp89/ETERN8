import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const MAX_FETCH = 500;

function matchesTextQuery(
  memory: Record<string, unknown>,
  q: string,
): boolean {
  const title = typeof memory.title === 'string' ? memory.title.toLowerCase() : '';
  const content = typeof memory.content === 'string' ? memory.content.toLowerCase() : '';
  const lovedOneName =
    typeof memory.loved_one_name === 'string' ? memory.loved_one_name.toLowerCase() : '';
  const tags = Array.isArray(memory.tags) ? memory.tags : [];

  return (
    title.includes(q) ||
    content.includes(q) ||
    lovedOneName.includes(q) ||
    tags.some((tag) => typeof tag === 'string' && tag.toLowerCase().includes(q))
  );
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const query = typeof body.query === 'string' ? body.query.trim() : '';
    const emotion = typeof body.emotion === 'string' ? body.emotion.trim() : '';
    const lovedOneId =
      typeof body.loved_one_id === 'string' ? body.loved_one_id.trim() : '';
    const limit = typeof body.limit === 'number' && body.limit > 0
      ? Math.min(body.limit, 100)
      : 100;

    const filterQuery: Record<string, string> = { created_by_id: user.id };
    if (emotion) filterQuery.emotion = emotion;
    if (lovedOneId) filterQuery.loved_one_id = lovedOneId;

    const memories = await base44.entities.Memory.filter(
      filterQuery,
      '-created_date',
      MAX_FETCH,
    );

    let hasAnyMemories = memories.length > 0;
    if (!hasAnyMemories && (emotion || lovedOneId)) {
      const ownedProbe = await base44.entities.Memory.filter(
        { created_by_id: user.id },
        '-created_date',
        1,
      );
      hasAnyMemories = ownedProbe.length > 0;
    }

    let results = memories;
    if (query) {
      const q = query.toLowerCase();
      results = memories.filter((memory) => matchesTextQuery(memory, q));
    }

    return Response.json({
      memories: results.slice(0, limit),
      total: results.length,
      hasAnyMemories,
      truncated: results.length > limit,
    });
  } catch (_error) {
    return Response.json({ error: 'Could not search memories' }, { status: 500 });
  }
});
