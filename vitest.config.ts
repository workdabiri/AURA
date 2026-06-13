import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
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
