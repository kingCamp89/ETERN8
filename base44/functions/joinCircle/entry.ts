import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { hashToken } from '../_shared/hashToken.ts';

async function findInviteTokenIndex(inviteTokens, inviteToken) {
  const tokenHash = await hashToken(inviteToken);
  return inviteTokens.findIndex(
    (t) =>
      (t.token_hash && t.token_hash === tokenHash) ||
      (t.token && t.token === inviteToken),
  );
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'You must be logged in' }, { status: 401 });
    }

    const { groupId, inviteToken } = await req.json();

    if (!groupId) {
      return Response.json({ error: 'Group ID is required' }, { status: 400 });
    }

    // Use service role to access groups (RLS locked to creator)
    const groups = await base44.asServiceRole.entities.MemoryGroup.filter({ id: groupId });
    if (!groups.length) {
      return Response.json({ error: 'Group not found' }, { status: 404 });
    }

    const group = groups[0];

    // Check invite token
    if (!inviteToken) {
      return Response.json({ error: 'An invite link is required to join this circle' }, { status: 403 });
    }

    const inviteTokens = group.invite_tokens || [];
    const tokenIndex = await findInviteTokenIndex(inviteTokens, inviteToken);

    if (tokenIndex === -1) {
      return Response.json({ error: 'Invalid or expired invite link' }, { status: 403 });
    }

    if (inviteTokens[tokenIndex].used) {
      return Response.json({ error: 'This invite link has already been used' }, { status: 403 });
    }

    if (group.member_ids?.includes(user.id)) {
      return Response.json({ success: true, alreadyMember: true });
    }

    const userName = user.full_name || 'Someone';

    const memberIds = [...(group.member_ids || []), user.id];
    const memberNames = [...(group.member_names || []), userName];
    const memberPhotos = [...(group.member_photos || []), user.photo_url || ''];

    const pendingInvites = (group.pending_invites || []).filter(
      (inv) => {
        const emailMatch = inv.email?.toLowerCase() === user.email?.toLowerCase();
        const nameMatch = inv.name?.trim().toLowerCase() === userName.trim().toLowerCase();
        return !emailMatch && !nameMatch;
      },
    );

    // Mark token as used; drop legacy plain token if present
    const updatedTokens = [...inviteTokens];
    const { token: _legacyToken, ...tokenEntry } = updatedTokens[tokenIndex];
    updatedTokens[tokenIndex] = { ...tokenEntry, used: true };

    // Use asServiceRole for update since the joiner is not the creator
    await base44.asServiceRole.entities.MemoryGroup.update(groupId, {
      member_ids: memberIds,
      member_names: memberNames,
      member_photos: memberPhotos,
      pending_invites: pendingInvites,
      invite_tokens: updatedTokens,
    });

    return Response.json({ success: true });
  } catch (_error) {
    return Response.json({ error: 'Could not join circle' }, { status: 500 });
  }
});
