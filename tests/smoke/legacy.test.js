import { beforeEach, describe, expect, it, vi } from 'vitest';
import { hashToken } from '../../base44/functions/_shared/hashToken.ts';

const trustedContactFilter = vi.fn();

vi.mock('@/api/base44Client', () => ({
  base44: {
    entities: {
      TrustedContact: { filter: (...args) => trustedContactFilter(...args) },
    },
    functions: { invoke: vi.fn() },
  },
}));

import { canViewLegacyContent } from '@/lib/permissions';

async function findInviteTokenIndex(inviteTokens, inviteToken) {
  const tokenHash = await hashToken(inviteToken);
  return inviteTokens.findIndex(
    (t) =>
      (t.token_hash && t.token_hash === tokenHash) ||
      (t.token && t.token === inviteToken),
  );
}

describe('legacy smoke', () => {
  beforeEach(() => {
    trustedContactFilter.mockReset();
  });

  describe('hashToken', () => {
    it('produces stable SHA-256 hex digests', async () => {
      const raw = 'circle-invite-abc123';
      const hash = await hashToken(raw);
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
      expect(await hashToken(raw)).toBe(hash);
      expect(await hashToken('other-token')).not.toBe(hash);
    });
  });

  describe('circle invite token lookup', () => {
    it('matches hashed tokens and supports legacy plain tokens', async () => {
      const raw = 'legacy-plain-token';
      const tokenHash = await hashToken(raw);

      const hashedIndex = await findInviteTokenIndex(
        [{ token_hash: tokenHash, used: false }],
        raw,
      );
      expect(hashedIndex).toBe(0);

      const legacyIndex = await findInviteTokenIndex(
        [{ token: raw, used: false }],
        raw,
      );
      expect(legacyIndex).toBe(0);

      const missing = await findInviteTokenIndex(
        [{ token_hash: tokenHash, used: false }],
        'wrong-token',
      );
      expect(missing).toBe(-1);
    });
  });

  describe('canViewLegacyContent', () => {
    it('denies without verified trusted contacts', async () => {
      trustedContactFilter.mockResolvedValue([]);
      expect(await canViewLegacyContent('user-1', 'content-1')).toBe(false);
      expect(trustedContactFilter).toHaveBeenCalledWith({
        user_id: 'user-1',
        is_verified: true,
        verification_status: 'verified',
      });
    });

    it('allows verified trusted contacts', async () => {
      trustedContactFilter.mockResolvedValue([{ id: 'tc-1' }]);
      expect(await canViewLegacyContent('user-1', 'content-1')).toBe(true);
    });

    it('fails closed on missing input', async () => {
      expect(await canViewLegacyContent(null, 'content-1')).toBe(false);
      expect(trustedContactFilter).not.toHaveBeenCalled();
    });
  });
});
