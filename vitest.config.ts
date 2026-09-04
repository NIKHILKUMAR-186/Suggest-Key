import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: [],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json'],
      include: ['src/lib/recommendations.ts', 'src/domains/advisor/AdvisorService.ts'],
    },
  },
});
