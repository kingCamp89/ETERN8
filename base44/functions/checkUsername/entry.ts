import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const { username } = await req.json();
    if (!username || username.length < 3) {
      return Response.json({ available: false, reason: 'Username must be at least 3 characters' });
    }

    // Only allow letters, numbers, underscores, dots
    if (!/^[a-zA-Z0-9._]+$/.test(username)) {
      return Response.json({ available: false, reason: 'Only letters, numbers, dots, and underscores allowed' });
    }

    const existing = await base44.asServiceRole.entities.User.filter({ username });

    return Response.json({ available: existing.length === 0 });
  } catch (_error) {
    return Response.json({ error: 'Could not check username' }, { status: 500 });
  }
});