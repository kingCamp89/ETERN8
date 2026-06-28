import { base44 } from '@/api/base44Client';

/**
 * Syncs MemoryShare rows for a memory's share_with_ids via the shareMemory backend
 * function (friendship validation, notifications, revoke removed recipients).
 */
export async function syncMemoryShares(memory) {
  if (!memory?.id) return;

  const targetFriendIds = [...new Set(memory.share_with_ids || [])];
  if (targetFriendIds.length === 0) return;

  await base44.functions.invoke('shareMemory', { memoryId: memory.id });
}
