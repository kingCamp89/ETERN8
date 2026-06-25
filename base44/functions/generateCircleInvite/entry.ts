import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function generateToken() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'You must be logged in' }, { status: 401 });
    }

    const { groupId } = await req.json();

    if (!groupId) {
      return Response.json({ error: 'Group ID is required' }, { status: 400 });
    }

    const groups = await base44.entities.MemoryGroup.filter({ id: groupId });
    if (!groups.length) {
      return Response.json({ error: 'Group not found' }, { status: 404 });
    }

    const group = groups[0];

    if (group.created_by_id !== user.id) {
      return Response.json({ error: 'Only the group creator can generate invite links' }, { status: 403 });
    }

    const token = generateToken();
    const inviteTokens = [...(group.invite_tokens || []), {
      token,
      created_at: new Date().toISOString(),
      used: false,
    }];

    await base44.entities.MemoryGroup.update(groupId, {
      invite_tokens: inviteTokens,
    });

    const inviteLink = `${req.headers.get('origin') || 'https://yourapp.com'}/groups/${groupId}?invite=${token}`;

    return Response.json({ success: true, token, inviteLink });
  } catch (_error) {
    return Response.json({ error: 'Could not generate invite' }, { status: 500 });
  }
});