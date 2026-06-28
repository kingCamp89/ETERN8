import { beforeEach, describe, expect, it } from 'vitest';
import {
  extractProvidedSecret,
  requireInternalSecret,
} from '../../base44/functions/_shared/internalAuth.ts';
import { hasSeenIntro, markIntroSeen } from '@/lib/introStorage';

describe('auth smoke', () => {
  describe('internalAuth', () => {
    beforeEach(() => {
      process.env.INTERNAL_FUNCTION_SECRET = 'test-internal-secret';
      delete process.env.CRON_SECRET;
    });

    it('extracts secret from X-Internal-Secret header', () => {
      const req = new Request('http://localhost', {
        headers: { 'x-internal-secret': 'header-secret' },
      });
      expect(extractProvidedSecret(req)).toBe('header-secret');
    });

    it('extracts secret from Authorization Bearer', () => {
      const req = new Request('http://localhost', {
        headers: { authorization: 'Bearer bearer-secret' },
      });
      expect(extractProvidedSecret(req)).toBe('bearer-secret');
    });

    it('allows cron jobs with matching secret', () => {
      const req = new Request('http://localhost', {
        headers: { authorization: 'Bearer test-internal-secret' },
      });
      expect(requireInternalSecret(req)).toBeNull();
    });

    it('rejects missing or wrong secret', async () => {
      const missing = requireInternalSecret(new Request('http://localhost'));
      expect(missing?.status).toBe(401);

      const wrong = requireInternalSecret(
        new Request('http://localhost', {
          headers: { 'x-internal-secret': 'wrong' },
        }),
      );
      expect(wrong?.status).toBe(401);
    });

    it('returns 503 when secret is not configured', () => {
      delete process.env.INTERNAL_FUNCTION_SECRET;
      const res = requireInternalSecret(new Request('http://localhost'));
      expect(res?.status).toBe(503);
    });
  });

  describe('introStorage', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('tracks first-run intro state', () => {
      expect(hasSeenIntro()).toBe(false);
      markIntroSeen();
      expect(hasSeenIntro()).toBe(true);
    });
  });
});
