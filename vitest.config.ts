import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    pool: 'forks',
    poolOptions: {
      forks: {
        // TypeORM loads the globbed .ts migrations through a
        // Function()-wrapped dynamic import that bypasses vitest's
        // transform pipeline. The tsx loader makes those files loadable
        // inside the fork workers.
        execArgv: ['--import', 'tsx'],
      },
    },
  },
});
