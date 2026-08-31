import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Unit tests only. tests/e2e/ belongs to Playwright, which owns a browser
    // and a server; running those here just produces confusing failures.
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
