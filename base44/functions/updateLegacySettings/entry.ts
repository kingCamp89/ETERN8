import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { legacy_enabled, legacy_wait_months, legacy_executor_id } = await req.json();

    if (legacy_wait_months !== undefined && (legacy_wait_months < 1 || legacy_wait_months > 6)) {
      return Response.json({ error: 'Wait period must be between 1 and 6 months' }, { status: 400 });
    }

    const updates = {};
    if (legacy_enabled !== undefined) updates.legacy_enabled = legacy_enabled;
    if (legacy_wait_months !== undefined) updates.legacy_wait_months = legacy_wait_months;
    if (legacy_executor_id !== undefined) updates.legacy_executor_id = legacy_executor_id || null;

    if (updates.legacy_enabled === true) {
      updates.last_checkin_date = new Date().toISOString();
      updates.legacy_triggered = false;
      updates.legacy_confirmations = 0;
    }

    await base44.auth.updateMe(updates);

    return Response.json({ success: true });
  } catch (_error) {
    return Response.json({ error: 'Could not update legacy settings' }, { status: 500 });
  }
});