import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

// Pure-logic + Pinia unit tests run in a plain Node environment (no Vue/Phaser DOM needed).
// `~` and `@` mirror Nuxt's srcDir alias so domain modules import unchanged.
const appDir = fileURLToPath(new URL('./app', import.meta.url))

export default defineConfig({
  resolve: {
    alias: { '~': appDir, '@': appDir },
  },
  test: {
    environment: 'node',
    include: ['test/**/*.spec.ts'],
    // Deterministic by default: no randomized test order, explicit seeding inside tests.
    sequence: { shuffle: false },
  },
})
