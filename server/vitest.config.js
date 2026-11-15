import { defineConfig } from 'vitest/config';

// The tests don't read .env: they get a fake secret here
export default defineConfig({
  test: {
    env: { JWT_SECRET: 'test-secret' },
  },
});
