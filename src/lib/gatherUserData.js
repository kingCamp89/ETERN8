async function fetchFriendships(base44, userId) {
  const [sent, received] = await Promise.all([
    base44.entities.Friendship.filter({ from_user_id: userId }),
    base44.entities.Friendship.filter({ to_user_id: userId }),
  ]);
  const byId = new Map();
  [...sent, ...received].forEach((row) => byId.set(row.id, row));
  return [...byId.values()];
}

async function fetchMemoryShares(base44, userId) {
  const [sent, received] = await Promise.all([
    base44.entities.MemoryShare.filter({ from_user_id: userId }),
    base44.entities.MemoryShare.filter({ to_user_id: userId }),
  ]);
  const byId = new Map();
  [...sent, ...received].forEach((row) => byId.set(row.id, row));
  return [...byId.values()];
}

async function fetchGroups(base44, userId) {
  const [owned, member] = await Promise.all([
    base44.entities.MemoryGroup.filter({ created_by_id: userId }),
    base44.entities.MemoryGroup.filter({ member_ids: userId }),
  ]);
  const byId = new Map();
  [...owned, ...member].forEach((row) => byId.set(row.id, row));
  return [...byId.values()];
}

/**
 * Collects all user-owned data visible via RLS for GDPR-style export.
 */
export async function gatherUserData(base44) {
  const user = await base44.auth.me();
  if (!user) throw new Error('Not signed in');

  const userId = user.id;

  const [
    memories,
    lovedOnes,
    memoryBooks,
    privateNotes,
    friendships,
    trustedContacts,
    executors,
    legacyProtocols,
    groups,
    memoryShares,
    notifications,
  ] = await Promise.all([
    base44.entities.Memory.filter({ created_by_id: userId }),
    base44.entities.LovedOne.filter({ created_by_id: userId }),
    base44.entities.MemoryBook.filter({ created_by_id: userId }),
    base44.entities.PrivateNote.filter({ created_by_id: userId }),
    fetchFriendships(base44, userId),
    base44.entities.TrustedContact.filter({ created_by_id: userId }),
    base44.entities.Executor.filter({ user_id: userId }),
    base44.entities.LegacyProtocol.filter({ user_id: userId }),
    fetchGroups(base44, userId),
    fetchMemoryShares(base44, userId),
    base44.entities.Notification.filter({ to_user_id: userId }),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    exportVersion: '1.0',
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      display_name: user.display_name,
      username: user.username,
      photo_url: user.photo_url,
      created_date: user.created_date,
    },
    memories,
    lovedOnes,
    memoryBooks,
    privateNotes,
    friendships,
    trustedContacts,
    executors,
    legacyProtocols,
    groups,
    memoryShares,
    notifications,
  };
}
