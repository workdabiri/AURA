import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, test } from 'vitest'

/**
 * AURA-206 — static assertions that the Lighthouse CI workflow stays ADVISORY / non-blocking.
 *
 * Lighthouse must never become a merge gate (CF-4): it runs on PRs to `develop`, is allowed to
 * fail (`continue-on-error: true`), enforces NO score thresholds, and is never added to the
 * required branch-protection check set. This test reads the workflow file and guards those
 * properties so a future edit cannot silently make it blocking.
 */
const workflow = readFileSync(join(process.cwd(), '.github/workflows/lighthouse.yml'), 'utf8')

// Active YAML only — strip comment lines so prose in the file header (which legitimately
// mentions "assertions", "thresholds", "configPath" while explaining what is NOT used) cannot
// trip the negative threshold assertions below.
const activeYaml = workflow
  .split('\n')
  .filter((line) => !/^\s*#/.test(line))
  .join('\n')

describe('lighthouse workflow is advisory (AURA-206 / CF-4)', () => {
  test('is enabled — not gated behind `if: false`', () => {
    expect(workflow).not.toMatch(/if:\s*false/)
  })

  test('triggers on pull requests to develop', () => {
    expect(workflow).toMatch(/pull_request:/)
    expect(workflow).toMatch(/branches:\s*\[develop\]/)
  })

  test('is non-blocking via continue-on-error: true', () => {
    expect(workflow).toMatch(/continue-on-error:\s*true/)
  })

  test('uses the treosh/lighthouse-ci-action GitHub Action (no npm Lighthouse dep)', () => {
    expect(workflow).toMatch(/treosh\/lighthouse-ci-action/)
  })

  test('does NOT enforce score thresholds / assertions', () => {
    expect(activeYaml).not.toMatch(/assert/i)
    expect(activeYaml).not.toMatch(/minScore/i)
    expect(activeYaml).not.toMatch(/budgetPath/i)
    expect(activeYaml).not.toMatch(/configPath/i)
  })

  test('documents that hard-gating is deferred to the release gate (AURA-505)', () => {
    expect(workflow).toMatch(/AURA-505/)
  })
})
