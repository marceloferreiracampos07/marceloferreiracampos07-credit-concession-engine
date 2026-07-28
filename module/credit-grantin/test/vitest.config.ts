import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globalSetup: './test/vitest.setup.ts',
    testTimeout: 30_000,
  },
});
