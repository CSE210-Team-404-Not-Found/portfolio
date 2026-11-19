// Playwright fixtures that keep the browser's coverage. The dev server
// instruments src/ when VITE_COVERAGE is set (vite.config.ts), the page counts
// in window.__coverage__, and this saves the counts before every navigation
// away (sign-in leaves for the PDS) and at the end of each test, as JSON in
// coverage-e2e/raw/. coverage-report.ts turns them into one lcov file.
import { randomUUID } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { test as base } from '@playwright/test'

export const RAW_DIR = fileURLToPath(new URL('../coverage-e2e/raw/', import.meta.url))

declare global {
  interface Window {
    /** Istanbul's counters, present only on instrumented pages. */
    __coverage__?: object
    /** Exposed by the fixture below; writes the counters to RAW_DIR. */
    saveCoverage: (json: string) => Promise<void>
  }
}

export const test = base.extend({
  // Named `provide`, not Playwright's usual `use`, which the React hooks lint
  // rule mistakes for React's `use`.
  context: async ({ context }, provide) => {
    mkdirSync(RAW_DIR, { recursive: true })
    await context.exposeFunction('saveCoverage', (json: string) => {
      writeFileSync(`${RAW_DIR}${randomUUID()}.json`, json)
    })
    await context.addInitScript(() => {
      window.addEventListener('beforeunload', () => {
        if (window.__coverage__) void window.saveCoverage(JSON.stringify(window.__coverage__))
      })
    })
    await provide(context)
    for (const page of context.pages()) {
      await page
        .evaluate(() =>
          window.__coverage__ ? window.saveCoverage(JSON.stringify(window.__coverage__)) : undefined,
        )
        // A page that closed or sits on another origin has nothing to save.
        .catch(() => undefined)
    }
  },
})

export { expect } from '@playwright/test'
