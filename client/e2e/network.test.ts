// The network itself, at the ports in docs/local-network.md. These tell a
// broken network apart from a broken client.
import { expect, test } from '@playwright/test'

const PDS = 'http://localhost:2583'
const APP_VIEW = 'http://localhost:2584'

test('the PDS resolves a seeded handle', async ({ request }) => {
  const res = await request.get(`${PDS}/xrpc/com.atproto.identity.resolveHandle`, {
    params: { handle: 'alice.test' },
  })
  expect(res.ok()).toBe(true)
  const { did } = (await res.json()) as { did: string }
  expect(did).toMatch(/^did:plc:/)
})

test('the AppView serves a seeded profile', async ({ request }) => {
  const res = await request.get(`${APP_VIEW}/xrpc/app.bsky.actor.getProfile`, {
    params: { actor: 'alice.test' },
  })
  expect(res.ok()).toBe(true)
  const { handle } = (await res.json()) as { handle: string }
  expect(handle).toBe('alice.test')
})
