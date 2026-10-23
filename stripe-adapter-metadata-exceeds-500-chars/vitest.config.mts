import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/stripe-mock.ts', './tests/setup.ts'],
    // Inline the plugin so `vi.mock('stripe')` also applies to its imports
    server: { deps: { inline: ['@payloadcms/plugin-ecommerce'] } },
  },
})
