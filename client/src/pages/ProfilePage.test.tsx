import { screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderAt } from '../test/render-at.tsx'

// fakes bluesky's getProfile so the tests don't hit the internet
function mockProfileResponse(status: number, body: unknown) {
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = String(input instanceof Request ? input.url : input)
    if (url.includes('app.bsky.actor.getProfile')) {
      return new Response(JSON.stringify(body), { status })
    }
    return new Response('{}', { status: 404 })
  })
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ProfilePage', () => {
  it('shows the name and handle', async () => {
    mockProfileResponse(200, { handle: 'alice.test', displayName: 'Alice' })
    renderAt('/profile/alice.test')

    expect(await screen.findByRole('heading', { level: 1, name: 'Alice' })).toBeInTheDocument()
    expect(screen.getByText('@alice.test')).toBeInTheDocument()
  })

  it('uses the handle as the name when there is no display name', async () => {
    mockProfileResponse(200, { handle: 'alice.test' })
    renderAt('/profile/alice.test')

    expect(
      await screen.findByRole('heading', { level: 1, name: 'alice.test' }),
    ).toBeInTheDocument()
  })

  it('says so when the handle has no account', async () => {
    mockProfileResponse(400, { error: 'InvalidRequest', message: 'Profile not found' })
    renderAt('/profile/nobody.test')

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Profile not found' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/@nobody\.test/)).toBeInTheDocument()
  })

  it('shows a try again button when bluesky is down', async () => {
    mockProfileResponse(500, {})
    renderAt('/profile/alice.test')

    expect(await screen.findByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })
})
