import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { lovedOneId } = await req.json();
    if (!lovedOneId) {
      return Response.json({ error: 'lovedOneId is required' }, { status: 400 });
    }

    const lovedOnes = await base44.entities.LovedOne.filter({ id: lovedOneId });
    if (!lovedOnes.length) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }

    return Response.json({ lovedOne: lovedOnes[0] });
  } catch (_error) {
    return Response.json({ error: 'Could not load profile' }, { status: 500 });
  }
});