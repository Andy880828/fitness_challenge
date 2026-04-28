import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

// Nuxt 4 結構：
// - `~` / `@` → app/   (client code, 含 components, composables, pages, utils)
// - `~~` / `@@` → rootDir
// - `#shared` → shared/ (純 TS，client + server 共用)
export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.spec.ts', 'tests/integration/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['app/**', 'shared/**', 'server/**'],
      exclude: ['**/*.spec.ts', '**/types/**', '**/.nuxt/**', 'app/**/*.vue'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./app/', import.meta.url)),
      '@': fileURLToPath(new URL('./app/', import.meta.url)),
      '~~': fileURLToPath(new URL('./', import.meta.url)),
      '@@': fileURLToPath(new URL('./', import.meta.url)),
      '#shared': fileURLToPath(new URL('./shared/', import.meta.url)),
    },
  },
})
