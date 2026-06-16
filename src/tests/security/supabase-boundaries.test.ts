import fs from 'node:fs'
import path from 'node:path'

import { describe, expect, test } from 'vitest'

describe('Supabase service-role server-only boundary (AURA-101)', () => {
  test('service-role.ts first import line is exactly: import "server-only"', () => {
    const filePath = path.resolve('src/lib/supabase/service-role.ts')
    const content = fs.readFileSync(filePath, 'utf-8')
    const firstLine = content.split('\n')[0]
    expect(firstLine).toBe("import 'server-only'")
  })

  test('dependency-cruiser config has no-client-to-service-role rule', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const config = require('../../../.dependency-cruiser.cjs') as {
      forbidden: Array<{ name: string; from: { path: string }; to: { path: string } }>
    }
    const rule = config.forbidden.find((r) => r.name === 'no-client-to-service-role')
    expect(rule).toBeDefined()
    expect(rule?.to?.path).toContain('service-role')
  })

  test('no-client-to-service-role rule covers src/components as the "from" boundary', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const config = require('../../../.dependency-cruiser.cjs') as {
      forbidden: Array<{ name: string; from: { path: string }; to: { path: string } }>
    }
    const rule = config.forbidden.find((r) => r.name === 'no-client-to-service-role')
    expect(rule?.from?.path).toContain('src/components')
  })

  test('no-client-to-service-role rule targets src/lib/supabase/service-role path', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const config = require('../../../.dependency-cruiser.cjs') as {
      forbidden: Array<{ name: string; from: { path: string }; to: { path: string } }>
    }
    const rule = config.forbidden.find((r) => r.name === 'no-client-to-service-role')
    expect(rule?.to?.path).toBe('^src/lib/supabase/service-role')
  })
})
