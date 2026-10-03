import { defineConfig } from 'vitest/config';

// Kept separate from vite.config.ts so unit tests don't spin up the Workers runtime.
// Sydney time, so the daylight-saving tests have real clock changes to find.
export default defineConfig({
  test: { include: ['src/**/*.test.ts', 'shared/**/*.test.ts'], environment: 'node', env: { TZ: 'Australia/Sydney' } },
});
