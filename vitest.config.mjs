import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.mjs', 'packages/*/tests/**/*.test.*'],
    testTimeout: 30000,
  },
});
