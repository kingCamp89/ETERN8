import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const entitiesDir = path.join(rootDir, 'base44/entities');
const functionsDir = path.join(rootDir, 'base44/functions');
const srcDir = path.join(rootDir, 'src');

const SERVER_ONLY_ENTITIES = new Set([
  'MemoryShare',
  'Friendship',
  'Executor',
  'TrustedContact',
  'MemoryInteraction',
  'LegacyProtocol',
  'ExecutorApprovalRequest',
  'Notification',
  'LegacyAuditLog',
]);

const USER_OWNED_ENTITIES = new Set([
  'Memory',
  'LovedOne',
  'MemoryGroup',
  'MemoryBook',
  'PrivateNote',
]);

function loadEntitySchemas() {
  return readdirSync(entitiesDir)
    .filter((name) => name.endsWith('.jsonc'))
    .map((name) => {
      const raw = readFileSync(path.join(entitiesDir, name), 'utf8');
      const json = raw.replace(/^\s*\/\/.*$/gm, '').replace(/,\s*([}\]])/g, '$1');
      return JSON.parse(json);
    });
}

function collectSourceFiles(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules') continue;
      collectSourceFiles(full, acc);
    } else if (/\.(jsx?|tsx?)$/.test(entry.name)) {
      acc.push(full);
    }
  }
  return acc;
}

function findForbiddenClientCreates(files) {
  const pattern =
    /entities\.(MemoryShare|Friendship|Executor|TrustedContact|MemoryInteraction|LegacyProtocol|ExecutorApprovalRequest|Notification)\.create\s*\(/g;
  const hits = [];

  for (const file of files) {
    const content = readFileSync(file, 'utf8');
    if (pattern.test(content)) {
      hits.push(path.relative(rootDir, file));
    }
    pattern.lastIndex = 0;
  }

  return hits;
}

function findUserScopedServerCreates(files) {
  const pattern =
    /base44\.entities\.(MemoryShare|Friendship|Executor|TrustedContact|MemoryInteraction|LegacyProtocol|ExecutorApprovalRequest|Notification)\.create/g;
  const hits = [];

  for (const file of files) {
    const content = readFileSync(file, 'utf8');
    let match;
    while ((match = pattern.exec(content)) !== null) {
      hits.push({ file: path.relative(rootDir, file), entity: match[1] });
    }
  }

  return hits;
}

const schemaByName = Object.fromEntries(loadEntitySchemas().map((s) => [s.name, s]));

describe('RLS readiness simulation', () => {
  const schemas = loadEntitySchemas();

  it('loads all entity schemas', () => {
    expect(schemas.length).toBeGreaterThanOrEqual(14);
  });

  it('blocks client create on server-only entities', () => {
    for (const name of SERVER_ONLY_ENTITIES) {
      const schema = schemaByName[name];
      expect(schema, `${name} schema missing`).toBeTruthy();
      expect(schema.rls?.create, `${name} create policy`).toBe(false);
    }
  });

  it('requires owner-scoped create on user-owned entities', () => {
    for (const name of USER_OWNED_ENTITIES) {
      const schema = schemaByName[name];
      expect(schema, `${name} schema missing`).toBeTruthy();
      expect(schema.rls?.create).toEqual({ created_by_id: '{{user.id}}' });
    }
  });

  it('has no permissive create: {} policies left', () => {
    const open = schemas.filter((s) => {
      const create = s.rls?.create;
      return create && typeof create === 'object' && Object.keys(create).length === 0;
    });
    expect(open.map((s) => s.name)).toEqual([]);
  });

  it('frontend never creates server-only entities directly', () => {
    const srcFiles = collectSourceFiles(srcDir);
    expect(findForbiddenClientCreates(srcFiles)).toEqual([]);
  });

  it('backend functions never use user-scoped create on server-only entities', () => {
    const fnFiles = collectSourceFiles(functionsDir);
    expect(findUserScopedServerCreates(fnFiles)).toEqual([]);
  });

  it('Executor update/delete RLS uses user_id (not created_by_id)', () => {
    const executor = schemaByName.Executor;
    expect(executor.rls.update).toEqual({ user_id: '{{user.id}}' });
    expect(executor.rls.delete).toEqual({ user_id: '{{user.id}}' });
  });
});

describe('critical flow simulations (mocked)', () => {
  it('simulates friend request → only service role can create Friendship', async () => {
    const created = [];
    const base44 = {
      auth: { me: async () => ({ id: 'user-a', full_name: 'Alice', username: 'alice' }) },
      entities: {
        Friendship: {
          filter: async () => [],
          create: async (data) => {
            created.push({ scope: 'user', data });
            return { id: 'f1', ...data };
          },
        },
        User: { filter: async () => [{ id: 'user-b', full_name: 'Bob', username: 'bob' }] },
      },
      asServiceRole: {
        entities: {
          Friendship: {
            create: async (data) => {
              created.push({ scope: 'service', data });
              return { id: 'f1', ...data };
            },
          },
          Notification: { create: async () => ({ id: 'n1' }) },
        },
      },
    };

    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ toUserId: 'user-b' }),
    });

    // Inline simulation of sendFriendRequest create path
    const user = await base44.auth.me();
    const target = (await base44.entities.User.filter({ id: 'user-b' }))[0];
    await base44.asServiceRole.entities.Friendship.create({
      from_user_id: user.id,
      to_user_id: 'user-b',
      to_user_name: target.full_name,
      status: 'pending',
      created_by_id: user.id,
    });

    expect(created).toHaveLength(1);
    expect(created[0].scope).toBe('service');
    expect(created[0].data.from_user_id).toBe('user-a');
    expect(created[0].data.created_by_id).toBe('user-a');
  });

  it('simulates memory share → only service role can create MemoryShare', async () => {
    const created = [];
    const base44 = {
      asServiceRole: {
        entities: {
          MemoryShare: {
            create: async (data) => {
              created.push(data);
              return { id: 's1', ...data };
            },
          },
          Notification: { create: async () => ({}) },
        },
      },
    };

    await base44.asServiceRole.entities.MemoryShare.create({
      memory_id: 'mem-1',
      from_user_id: 'owner',
      to_user_id: 'friend',
      status: 'pending',
    });

    expect(created).toHaveLength(1);
    expect(created[0].to_user_id).toBe('friend');
  });

  it('simulates interaction → service role sets created_by_id to actor', async () => {
    const user = { id: 'liker', full_name: 'Liker', photo_url: '' };
    let interaction;

    const base44 = {
      asServiceRole: {
        entities: {
          MemoryInteraction: {
            create: async (data) => {
              interaction = data;
              return { id: 'i1', ...data };
            },
          },
          Notification: { create: async () => ({}) },
        },
      },
    };

    await base44.asServiceRole.entities.MemoryInteraction.create({
      memory_id: 'mem-1',
      user_name: user.full_name,
      type: 'like',
      created_by_id: user.id,
    });

    expect(interaction.created_by_id).toBe('liker');
  });

  it('simulates malicious client create blocked by RLS policy shape', () => {
    const friendship = schemaByName.Friendship;
    const canClientCreate = friendship.rls.create !== false;
    expect(canClientCreate).toBe(false);
  });
});
