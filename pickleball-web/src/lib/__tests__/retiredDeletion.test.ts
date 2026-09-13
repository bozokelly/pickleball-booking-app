import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, it } from 'vitest';

it('cannot redeploy the removed destructive handler or call the retired endpoint', () => {
  expect(existsSync(resolve(process.cwd(), '../supabase/functions/delete-account/index.ts'))).toBe(false);
  const store = readFileSync(resolve(process.cwd(), 'src/stores/authStore.ts'), 'utf8');
  expect(store).not.toContain("invoke('delete-account'");
});
