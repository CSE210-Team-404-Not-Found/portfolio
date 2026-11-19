// Sign-in through the PDS's OAuth pages as a seeded account
// (docs/local-network.md), and what the client shows afterwards.
import type { Page } from '@playwright/test'
import { expect, test } from './coverage.ts'

const HANDLE = 'alice.test'
const PASSWORD = 'hunter2'

/** From the app's form to the PDS's consent page. */
async function reachConsent(page: Page) {
  await page.goto('/')
  await page.getByLabel('Handle').fill(HANDLE)
  await page.getByRole('button', { name: 'Sign in' }).click()
  // The PDS's sign-in page arrives with the handle filled in.
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
}

test('signs in and out', async ({ page }) => {
  await reachConsent(page)
  await page.getByRole('button', { name: 'Authorize' }).click()

  await expect(page.getByText(`Signed in as @${HANDLE}`)).toBeVisible()
  await expect(page.getByText(/^did:plc:/)).toBeVisible()

  await page.getByRole('button', { name: 'Sign out' }).click()
  await expect(page.getByLabel('Handle')).toBeVisible()
})

test('reports a denied sign-in', async ({ page }) => {
  await reachConsent(page)
  await page.getByRole('button', { name: 'Deny access' }).click()

  await expect(page.getByRole('alert')).toBeVisible()
  await expect(page.getByLabel('Handle')).toBeVisible()
})
