import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const escapeHtml = (str: string) =>
  (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { groupId, inviteEmails } = body;

        if (!groupId || !inviteEmails?.length) {
            return Response.json({ error: 'Missing groupId or inviteEmails' }, { status: 400 });
        }

        const groups = await base44.asServiceRole.entities.MemoryGroup.filter({ id: groupId });
        if (!groups.length) {
            return Response.json({ error: 'Group not found' }, { status: 404 });
        }

        const group = groups[0];
        const isMember = group.created_by_id === user.id || (group.member_ids || []).includes(user.id);
        if (!isMember) {
            return Response.json({ error: 'Not a member of this group' }, { status: 403 });
        }

        const groupName = escapeHtml(String(group.name || 'Circle'));
        const senderName = escapeHtml(String(user.full_name || user.display_name || 'Someone'));
        const origin = req.headers.get('origin') || req.headers.get('referer')?.replace(/\/$/, '') || '';
        const inviteLink = escapeHtml(origin ? `${origin}/groups/${groupId}` : `/groups/${groupId}`);
        const apiKey = Deno.env.get('RESEND_API_KEY');

        const results = [];
        for (const invite of inviteEmails) {
            const inviteName = escapeHtml(String(invite.name || 'there'));
            const inviteEmail = String(invite.email || '').trim();
            if (!inviteEmail) {
                results.push({ email: invite.email, sent: false, error: 'Missing email' });
                continue;
            }

            try {
                const res = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        from: 'Memory Lane <onboarding@resend.dev>',
                        to: [inviteEmail],
                        subject: `${user.full_name || user.display_name || 'Someone'} invited you to "${group.name || 'Circle'}" on Memory Lane`,
                        html: `<p>Hi ${inviteName},</p>
<p>${senderName} has invited you to join <strong>"${groupName}"</strong> on Memory Lane — a place to share and relive precious memories together.</p>
<p><a href="${inviteLink}" style="display:inline-block;padding:12px 24px;background:#c75b39;color:white;border-radius:12px;text-decoration:none;font-weight:600;margin:16px 0;">Join the Circle</a></p>
<p>No account yet? No worries — you'll be guided to create one when you accept the invitation.</p>
<p>With love,<br/>The Memory Lane Team</p>`,
                    }),
                });

                const data = await res.json();
                if (res.ok) {
                    results.push({ email: inviteEmail, sent: true });
                } else {
                    results.push({ email: inviteEmail, sent: false, error: data.message || 'Resend error' });
                }
            } catch (err) {
                results.push({ email: inviteEmail, sent: false, error: err.message });
            }
        }

        return Response.json({ success: true, results });
    } catch (_error) {
      return Response.json({ error: 'Could not send invitations' }, { status: 500 });
    }
});