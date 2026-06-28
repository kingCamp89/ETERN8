import { vi } from 'vitest';

vi.stubGlobal('Deno', {
  env: {
    get: (key) => process.env[key],
  },
});
