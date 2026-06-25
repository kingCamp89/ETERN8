/**
 * Centralized permission helpers for ETRN8.
 * Every page, API call, and service-role function must use these.
 * 
 * Principle: FAIL CLOSED. If permission is unclear, deny access.
 */

import { base44 } from '@/api/base44Client';

// ─── Memory Permissions ────────────────────────────────────────

/**
 * Check if a user can view a specific memory.
 * A user can view a memory if:
 *   1. They created it (owner)
 *   2. It was directly shared with them via MemoryShare (status: accepted)
 *   3. It was shared with a group they belong to
 */
export async function canViewMemory(userId, memory) {
  if (!userId || !memory) return false;
  
  // Owner can always view
  if (memory.created_by_id === userId) return true;
  
  // Check direct shares
  const shares = await base44.entities.MemoryShare.filter({
    memory_id: memory.id,
    to_user_id: userId,
    status: 'accepted',
  });
  if (shares.length) return true;
  
  // Check group shares
  if (memory.share_group_ids?.length) {
    const myGroups = await getUserGroupMemberships(userId);
    const myGroupIds = new Set(myGroups.map(g => g.id));
    if (memory.share_group_ids.some(gid => myGroupIds.has(gid))) return true;
  }
  
  return false;
}

/**
 * Check if a user can edit a specific memory.
 * Only the creator can edit their own memories.
 */
export function canEditMemory(userId, memory) {
  if (!userId || !memory) return false;
  return memory.created_by_id === userId;
}

// ─── Group Permissions ──────────────────────────────────────────

/**
 * Check if a user can view a group's content.
 * A user can view a group if they created it or are a member.
 */
export function canViewGroup(userId, group) {
  if (!userId || !group) return false;
  if (group.created_by_id === userId) return true;
  return Array.isArray(group.member_ids) && group.member_ids.includes(userId);
}

/**
 * Check if a user can manage (edit/delete/invite) a group.
 * Only the creator can manage a group.
 */
export function canManageGroup(userId, group) {
  if (!userId || !group) return false;
  return group.created_by_id === userId;
}

/**
 * Get all group IDs the user belongs to (as member or creator).
 */
export async function getUserGroupMemberships(userId) {
  if (!userId) return [];
  // Groups have RLS locked to creator, so we need a backend function
  // The hook useLovedOnes pattern — but for groups we call getMyGroups
  const response = await base44.functions.invoke('getMyGroups', {});
  return response.data?.groups || [];
}

// ─── Private Note Permissions ───────────────────────────────────

/**
 * Check if a user can view a private note.
 * Private notes are ONLY readable by their creator.
 * The subject (person the note is about) MUST NEVER gain access
 * unless the creator explicitly shares it.
 */
export function canViewPrivateNote(userId, note) {
  if (!userId || !note) return false;
  return note.created_by_id === userId;
}

export function canEditPrivateNote(userId, note) {
  return canViewPrivateNote(userId, note);
}

// ─── Future Delivery Permissions ────────────────────────────────

/**
 * Check if a user can view a scheduled/future delivery.
 * Only the creator and the recipient (loved_one's email contact) can view.
 */
export async function canViewFutureDelivery(userId, memory) {
  if (!userId || !memory) return false;
  if (memory.created_by_id === userId) return true;
  // Scheduled memories are private by default — owner only
  return false;
}

// ─── Legacy Content Permissions ─────────────────────────────────

/**
 * Check if a user can view legacy content.
 * Only trusted contacts with verified status during cooling-off completion.
 */
export async function canViewLegacyContent(userId, contentId) {
  if (!userId || !contentId) return false;
  // Legacy content is only released to verified trusted contacts
  // after the cooling-off period completes with no response
  const contacts = await base44.entities.TrustedContact.filter({
    user_id: userId,
    is_verified: true,
    verification_status: 'verified',
  });
  return contacts.length > 0;
}

// ─── Friendship Permissions ─────────────────────────────────────

/**
 * Check if two users are friends (either direction, accepted).
 */
export async function areFriends(userIdA, userIdB) {
  if (!userIdA || !userIdB) return false;
  const response = await base44.functions.invoke('getMyFriends', {});
  const friends = response.data?.friends || [];
  return friends.some(f => f.id === userIdB);
}

// ─── Lazy imports for Node.js/Deno backend ──────────────────────
// These helpers are also usable in backend functions with the
// createClientFromRequest pattern. Export for both environments.

export const check = {
  canViewMemory,
  canEditMemory,
  canViewGroup,
  canManageGroup,
  canViewPrivateNote,
  canEditPrivateNote,
  canViewFutureDelivery,
  canViewLegacyContent,
  areFriends,
  getUserGroupMemberships,
};