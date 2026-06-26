import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  // tsconfig sets `jsx: preserve` for Next.js; the Vite 8 (oxc) transformer otherwise emits
  // that JSX unchanged, so the node-env suite cannot render `.tsx` components. Force the
  // automatic JSX runtime here for the AURA-205 safe Markdown renderer test.
  oxc: {
    jsx: { runtime: 'automatic' },
  },
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./src/tests/setup.ts'],
    include: [
      'src/tests/unit/**/*.{test,spec}.{ts,tsx}',
      'src/tests/dal/**/*.{test,spec}.{ts,tsx}',
      'src/tests/integration/**/*.{test,spec}.{ts,tsx}',
      'src/tests/security/**/*.{test,spec}.{ts,tsx}',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      exclude: ['node_modules/', '.next/', 'src/tests/', '**/*.config.*', '**/*.d.ts'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
