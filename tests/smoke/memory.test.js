import { beforeEach, describe, expect, it, vi } from 'vitest';

const memoryShareFilter = vi.fn();
const functionsInvoke = vi.fn();

vi.mock('@/api/base44Client', () => ({
  base44: {
    entities: {
      MemoryShare: { filter: (...args) => memoryShareFilter(...args) },
      TrustedContact: { filter: vi.fn() },
    },
    functions: {
      invoke: (...args) => functionsInvoke(...args),
    },
  },
}));

import {
  canEditMemory,
  canViewMemory,
  canViewFutureDelivery,
  canViewPrivateNote,
} from '@/lib/permissions';
import { validateImageUpload } from '@/lib/validateImageUpload';

describe('memory smoke', () => {
  beforeEach(() => {
    memoryShareFilter.mockReset();
    functionsInvoke.mockReset();
  });

  describe('canEditMemory', () => {
    it('allows only the creator to edit', () => {
      const memory = { id: 'm1', created_by_id: 'owner' };
      expect(canEditMemory('owner', memory)).toBe(true);
      expect(canEditMemory('other', memory)).toBe(false);
      expect(canEditMemory(null, memory)).toBe(false);
    });
  });

  describe('canViewMemory', () => {
    it('allows owner without backend lookups', async () => {
      const memory = { id: 'm1', created_by_id: 'owner' };
      expect(await canViewMemory('owner', memory)).toBe(true);
      expect(memoryShareFilter).not.toHaveBeenCalled();
    });

    it('allows accepted direct shares', async () => {
      memoryShareFilter.mockResolvedValue([{ id: 'share1' }]);
      const memory = { id: 'm1', created_by_id: 'owner' };
      expect(await canViewMemory('friend', memory)).toBe(true);
      expect(memoryShareFilter).toHaveBeenCalledWith({
        memory_id: 'm1',
        to_user_id: 'friend',
        status: 'accepted',
      });
    });

    it('allows group members when memory is shared to their group', async () => {
      memoryShareFilter.mockResolvedValue([]);
      functionsInvoke.mockResolvedValue({ data: { groups: [{ id: 'g1' }] } });
      const memory = {
        id: 'm1',
        created_by_id: 'owner',
        share_group_ids: ['g1'],
      };
      expect(await canViewMemory('member', memory)).toBe(true);
    });

    it('denies when no share path exists', async () => {
      memoryShareFilter.mockResolvedValue([]);
      functionsInvoke.mockResolvedValue({ data: { groups: [] } });
      const memory = { id: 'm1', created_by_id: 'owner', share_group_ids: ['g1'] };
      expect(await canViewMemory('stranger', memory)).toBe(false);
    });
  });

  describe('canViewFutureDelivery', () => {
    it('is owner-only', async () => {
      const memory = { id: 'm1', created_by_id: 'owner' };
      expect(await canViewFutureDelivery('owner', memory)).toBe(true);
      expect(await canViewFutureDelivery('other', memory)).toBe(false);
    });
  });

  describe('canViewPrivateNote', () => {
    it('is creator-only', () => {
      const note = { id: 'n1', created_by_id: 'author', person_id: 'subject' };
      expect(canViewPrivateNote('author', note)).toBe(true);
      expect(canViewPrivateNote('subject', note)).toBe(false);
    });
  });

  describe('validateImageUpload', () => {
    it('accepts allowed image types within size limit', () => {
      const file = { type: 'image/jpeg', size: 1024 };
      expect(validateImageUpload(file)).toBeNull();
    });

    it('rejects unsupported types and oversized files', () => {
      expect(validateImageUpload({ type: 'application/pdf', size: 100 })).toMatch(/Unsupported/);
      expect(validateImageUpload({ type: 'image/png', size: 21 * 1024 * 1024 })).toMatch(/too large/);
      expect(validateImageUpload(null)).toBe('No file selected');
    });
  });
});
