import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const PAGE_SIZE = 100;

async function fetchAll(sr, entityName, query = {}) {
  const results = [];
  let skip = 0;

  while (true) {
    const batch = await sr.entities[entityName].filter(query, undefined, PAGE_SIZE, skip);
    if (!batch.length) break;
    results.push(...batch);
    if (batch.length < PAGE_SIZE) break;
    skip += PAGE_SIZE;
  }

  return results;
}

async function deleteManySafe(sr, entityName, query) {
  try {
    await sr.entities[entityName].deleteMany(query);
  } catch {
    const records = await fetchAll(sr, entityName, query);
    await Promise.all(records.map((record) => sr.entities[entityName].delete(record.id)));
  }
}

function collectMediaUrls(user, memories, lovedOnes, groups, books) {
  const urls = new Set<string>();

  const add = (url?: string | null) => {
    if (url && typeof url === 'string') urls.add(url);
  };

  add(user.photo_url);

  for (const memory of memories) add(memory.media_url);
  for (const lovedOne of lovedOnes) add(lovedOne.photo_url);
  for (const group of groups) add(group.group_photo_url);
  for (const book of books) add(book.cover_photo_url);

  return [...urls];
}

async function deleteUploadedMedia(sr, urls: string[]) {
  const deleteFile = sr.integrations?.Core?.DeleteFile;
  if (typeof deleteFile !== 'function') return;

  await Promise.all(
    urls.map(async (file_url) => {
      try {
        await deleteFile({ file_url });
      } catch {
        // Best-effort — Base44 may not expose DeleteFile in all environments.
      }
    }),
  );
}

async function removeUserFromMemberGroups(sr, userId: string) {
  const memberGroups = await fetchAll(sr, 'MemoryGroup', { member_ids: userId });

  for (const group of memberGroups) {
    if (group.created_by_id === userId) continue;

    const removeIndex = (group.member_ids || []).indexOf(userId);
    if (removeIndex === -1) continue;

    const memberIds = [...group.member_ids];
    const memberNames = [...(group.member_names || [])];
    const memberPhotos = [...(group.member_photos || [])];

    memberIds.splice(removeIndex, 1);
    memberNames.splice(removeIndex, 1);
    memberPhotos.splice(removeIndex, 1);

    await sr.entities.MemoryGroup.update(group.id, {
      member_ids: memberIds,
      member_names: memberNames,
      member_photos: memberPhotos,
    });
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sr = base44.asServiceRole;
    const userId = user.id;
    const userEmail = user.email?.trim().toLowerCase();

    const [memories, lovedOnes, ownedGroups, memberGroups, books] = await Promise.all([
      fetchAll(sr, 'Memory', { created_by_id: userId }),
      fetchAll(sr, 'LovedOne', { created_by_id: userId }),
      fetchAll(sr, 'MemoryGroup', { created_by_id: userId }),
      fetchAll(sr, 'MemoryGroup', { member_ids: userId }),
      fetchAll(sr, 'MemoryBook', { created_by_id: userId }),
    ]);

    const groups = [...new Map([...ownedGroups, ...memberGroups].map((g) => [g.id, g])).values()];
    const mediaUrls = collectMediaUrls(user, memories, lovedOnes, groups, books);

    const ownedExecutors = await fetchAll(sr, 'Executor', { user_id: userId });
    const emailExecutors = userEmail
      ? await fetchAll(sr, 'Executor', { email: user.email })
      : [];
    const executorIds = [...new Set([...ownedExecutors, ...emailExecutors].map((e) => e.id))];

    await Promise.all([
      deleteManySafe(sr, 'MemoryInteraction', { created_by_id: userId }),
      deleteManySafe(sr, 'MemoryShare', { from_user_id: userId }),
      deleteManySafe(sr, 'MemoryShare', { to_user_id: userId }),
      deleteManySafe(sr, 'Notification', { from_user_id: userId }),
      deleteManySafe(sr, 'Notification', { to_user_id: userId }),
      deleteManySafe(sr, 'PrivateNote', { created_by_id: userId }),
      deleteManySafe(sr, 'Friendship', { from_user_id: userId }),
      deleteManySafe(sr, 'Friendship', { to_user_id: userId }),
    ]);

    await Promise.all([
      deleteManySafe(sr, 'Memory', { created_by_id: userId }),
      deleteManySafe(sr, 'MemoryBook', { created_by_id: userId }),
      deleteManySafe(sr, 'LovedOne', { created_by_id: userId }),
    ]);

    await Promise.all(ownedGroups.map((group) => sr.entities.MemoryGroup.delete(group.id)));
    await removeUserFromMemberGroups(sr, userId);

    await Promise.all([
      deleteManySafe(sr, 'TrustedContact', { created_by_id: userId }),
      deleteManySafe(sr, 'LegacyProtocol', { user_id: userId }),
      deleteManySafe(sr, 'LegacyAuditLog', { user_id: userId }),
      deleteManySafe(sr, 'LegacyAuditLog', { created_by_id: userId }),
      deleteManySafe(sr, 'ExecutorApprovalRequest', { user_id: userId }),
      ...executorIds.map((executorId) =>
        deleteManySafe(sr, 'ExecutorApprovalRequest', { executor_id: executorId }),
      ),
      deleteManySafe(sr, 'Executor', { user_id: userId }),
      userEmail ? deleteManySafe(sr, 'Executor', { email: user.email }) : Promise.resolve(),
      userEmail ? deleteManySafe(sr, 'TrustedContact', { email: user.email }) : Promise.resolve(),
    ]);

    await deleteUploadedMedia(sr, mediaUrls);
    await sr.entities.User.delete(userId);

    return Response.json({ success: true });
  } catch (_error) {
    return Response.json({ error: 'Could not delete account' }, { status: 500 });
  }
});
