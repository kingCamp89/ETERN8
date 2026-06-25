import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { query } = await req.json();
    if (!query || typeof query !== 'string' || query.length < 2) {
      return Response.json({ users: [] });
    }

    const q = query.toLowerCase().trim();

    const allUsers = await base44.entities.User.list();
    const results = allUsers
      .filter(u =>
        u.id !== user.id &&
        u.username &&
        typeof u.username === 'string' &&
        u.username.toLowerCase().includes(q)
      )
      .slice(0, 20)
      .map(u => ({
        id: u.id,
        username: u.username,
        full_name: u.full_name || '',
        photo_url: u.photo_url || null,
      }));

    return Response.json({ users: results });
  } catch (_error) {
    return Response.json({ error: 'Could not search users' }, { status: 500 });
  }
});