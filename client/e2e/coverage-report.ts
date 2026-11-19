// Playwright's global teardown: merges the raw coverage that coverage.ts saved
// into coverage-e2e/lcov.info, which sonar-project.properties lists next to
// the unit tests' file.
import { existsSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { CoverageReport } from 'monocart-coverage-reports'
import { RAW_DIR } from './coverage.ts'

const CLIENT = fileURLToPath(new URL('..', import.meta.url))

export default async function reportCoverage() {
  if (!existsSync(RAW_DIR)) return
  const report = new CoverageReport({
    name: 'End-to-end tests',
    outputDir: `${CLIENT}coverage-e2e`,
    reports: ['lcovonly'],
    // Paths relative to client/, as in Vitest's lcov.
    sourcePath: (file) => relative(CLIENT, file).replaceAll('\\', '/'),
    cleanCache: true,
    logging: 'error',
  })
  for (const name of readdirSync(RAW_DIR)) {
    await report.add(JSON.parse(readFileSync(`${RAW_DIR}${name}`, 'utf8')))
  }
  await report.generate()
  rmSync(RAW_DIR, { recursive: true, force: true })
}
