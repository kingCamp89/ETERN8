import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  extractProvidedSecret,
  requireInternalSecret,
} from '../../base44/functions/_shared/internalAuth.ts';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const functionsDir = path.join(rootDir, 'base44/functions');

const LOCKED_FUNCTIONS = [
  'checkLegacyStatus',
  'scheduledDeliveryProcessor',
  'validateLegacyRelease',
  'validateRecipientOwnership',
  'validateContentEligibility',
  'onMemoryInteraction',
];

const RLS_FUNCTION_UPDATES = [
  'sendFriendRequest',
  'addExecutor',
  'addTrustedContact',
  'createMemoryInteraction',
  'shareMemory',
  'deleteAccount',
];

function readEntry(functionName) {
  const file = path.join(functionsDir, functionName, 'entry.ts');
  return readFileSync(file, 'utf8');
}

describe('deploy readiness simulation', () => {
  it('all cron/validation functions require internal secret', () => {
    for (const name of LOCKED_FUNCTIONS) {
      const source = readEntry(name);
      expect(source, name).toMatch(/requireInternalSecret/);
    }
  });

  it('RLS-hardened functions use asServiceRole for server-only creates', () => {
    const checks = [
      ['sendFriendRequest', /asServiceRole\.entities\.Friendship\.create/],
      ['addExecutor', /asServiceRole\.entities\.Executor\.create/],
      ['addTrustedContact', /asServiceRole\.entities\.TrustedContact\.create/],
      ['createMemoryInteraction', /asServiceRole\.entities\.MemoryInteraction\.create/],
      ['shareMemory', /asServiceRole\.entities\.MemoryShare\.create/],
    ];

    for (const [name, pattern] of checks) {
      expect(readEntry(name), name).toMatch(pattern);
    }
  });

  it('deleteAccount function exists and uses service role', () => {
    const source = readEntry('deleteAccount');
    expect(source).toMatch(/asServiceRole/);
    expect(source).toMatch(/deleteManySafe|delete\(/);
  });

  it('syncMemoryShares has no client-side MemoryShare.create fallback', () => {
    const source = readFileSync(path.join(rootDir, 'src/lib/syncMemoryShares.js'), 'utf8');
    expect(source).not.toMatch(/MemoryShare\.create/);
    expect(source).toMatch(/shareMemory/);
  });

  it('lists functions that must be deployed after RLS change', () => {
    const deployed = readdirSync(functionsDir).filter((name) => {
      const entry = path.join(functionsDir, name, 'entry.ts');
      try {
        return statSync(entry).isFile();
      } catch {
        return false;
      }
    });

    for (const name of [...LOCKED_FUNCTIONS, ...RLS_FUNCTION_UPDATES]) {
      expect(deployed, `missing function folder: ${name}`).toContain(name);
    }
  });
});

describe('internal auth attack simulation', () => {
  beforeEach(() => {
    process.env.INTERNAL_FUNCTION_SECRET = 'deploy-test-secret';
    delete process.env.CRON_SECRET;
  });

  it('rejects cron calls without secret', () => {
    const res = requireInternalSecret(new Request('http://localhost'));
    expect(res?.status).toBe(401);
  });

  it('rejects cron calls with wrong secret', () => {
    const res = requireInternalSecret(
      new Request('http://localhost', {
        headers: { authorization: 'Bearer wrong-secret' },
      }),
    );
    expect(res?.status).toBe(401);
  });

  it('accepts valid Bearer and X-Internal-Secret headers', () => {
    expect(
      requireInternalSecret(
        new Request('http://localhost', {
          headers: { authorization: 'Bearer deploy-test-secret' },
        }),
      ),
    ).toBeNull();

    expect(
      requireInternalSecret(
        new Request('http://localhost', {
          headers: { 'x-internal-secret': 'deploy-test-secret' },
        }),
      ),
    ).toBeNull();

    expect(
      extractProvidedSecret(
        new Request('http://localhost', {
          headers: { 'x-internal-secret': 'deploy-test-secret' },
        }),
      ),
    ).toBe('deploy-test-secret');
  });

  it('fails closed when secret env is missing', () => {
    delete process.env.INTERNAL_FUNCTION_SECRET;
    const res = requireInternalSecret(new Request('http://localhost'));
    expect(res?.status).toBe(503);
  });
});
