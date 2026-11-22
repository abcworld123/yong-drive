import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // Picks up the bare `utils/...` and `svg/...` aliases from tsconfig.json.
    tsconfigPaths: true,
  },
  // An inline config stops Vite from loading postcss.config.js, whose string plugin names only Next understands.
  css: {
    postcss: {},
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    restoreMocks: true,
  },
});
