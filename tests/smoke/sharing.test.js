import { beforeEach, describe, expect, it, vi } from 'vitest';

const functionsInvoke = vi.fn();
const memoryShareFilter = vi.fn();

vi.mock('@/api/base44Client', () => ({
  base44: {
    entities: {
      MemoryShare: { filter: (...args) => memoryShareFilter(...args) },
    },
    functions: {
      invoke: (...args) => functionsInvoke(...args),
    },
  },
}));

import { areFriends } from '@/lib/permissions';
import { syncMemoryShares } from '@/lib/syncMemoryShares';

describe('sharing smoke', () => {
  beforeEach(() => {
    functionsInvoke.mockReset();
    memoryShareFilter.mockReset();
  });

  describe('syncMemoryShares', () => {
    it('invokes shareMemory when recipients are set', async () => {
      functionsInvoke.mockResolvedValue({ data: { success: true } });
      await syncMemoryShares({ id: 'mem-1', share_with_ids: ['u2', 'u3'] });
      expect(functionsInvoke).toHaveBeenCalledOnce();
      expect(functionsInvoke).toHaveBeenCalledWith('shareMemory', { memoryId: 'mem-1' });
    });

    it('deduplicates recipient ids before sharing', async () => {
      functionsInvoke.mockResolvedValue({ data: { success: true } });
      await syncMemoryShares({ id: 'mem-1', share_with_ids: ['u2', 'u2', 'u3'] });
      expect(functionsInvoke).toHaveBeenCalledOnce();
    });

    it('skips when memory id or recipients are missing', async () => {
      await syncMemoryShares(null);
      await syncMemoryShares({ id: 'mem-1', share_with_ids: [] });
      expect(functionsInvoke).not.toHaveBeenCalled();
    });
  });

  describe('areFriends', () => {
    it('returns true when friend list includes the other user', async () => {
      functionsInvoke.mockResolvedValue({
        data: { friends: [{ id: 'friend-b' }, { id: 'friend-c' }] },
      });
      expect(await areFriends('user-a', 'friend-b')).toBe(true);
      expect(functionsInvoke).toHaveBeenCalledWith('getMyFriends', {});
    });

    it('returns false for missing ids or non-friends', async () => {
      functionsInvoke.mockResolvedValue({ data: { friends: [] } });
      expect(await areFriends(null, 'friend-b')).toBe(false);
      expect(await areFriends('user-a', 'stranger')).toBe(false);
    });
  });
});
