import { screen, within } from '@testing-library/react'
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

  it('shows the job title, intro and links from the mock data', async () => {
    mockProfileResponse(200, { handle: 'alice.test', displayName: 'Alice' })
    renderAt('/profile/alice.test')

    expect(await screen.findByText('Student developer')).toBeInTheDocument()
    expect(screen.getByText(/Placeholder intro/)).toBeInTheDocument()
    // links open in a new tab so you don't lose the profile
    const linkedin = screen.getByRole('link', { name: /LinkedIn/ })
    expect(linkedin).toHaveAttribute('href', 'https://www.linkedin.com/')
    expect(linkedin).toHaveAttribute('target', '_blank')
  })

  it('has a top bar that jumps to the sections and a footer', async () => {
    mockProfileResponse(200, { handle: 'alice.test', displayName: 'Alice' })
    renderAt('/profile/alice.test')

    const nav = await screen.findByRole('navigation', { name: 'Portfolio sections' })
    expect(within(nav).getByRole('link', { name: 'Work' })).toHaveAttribute('href', '#work')
    expect(within(nav).getByRole('link', { name: 'About' })).toHaveAttribute('href', '#about')
    // the links only work if those ids are actually on the page
    expect(document.getElementById('work')).not.toBeNull()
    expect(document.getElementById('about')).not.toBeNull()

    expect(screen.getByText(`© ${new Date().getFullYear()} Alice`)).toBeInTheDocument()
    expect(screen.getByText('Made with OpenShowcase')).toBeInTheDocument()
  })

  it('shows numbered project cards that link to each project', async () => {
    mockProfileResponse(200, { handle: 'alice.test', displayName: 'Alice' })
    renderAt('/profile/alice.test')

    expect(await screen.findByRole('heading', { name: 'Selected work' })).toBeInTheDocument()
    // the first mock project is OpenShowcase and its summary says "portfolio site"
    expect(screen.getByRole('link', { name: /portfolio site/ })).toHaveAttribute(
      'href',
      '/profile/alice.test/project/3lbmockproj01',
    )
    // numbered like the figma
    expect(screen.getByText('01')).toBeInTheDocument()
    expect(screen.getByText('03')).toBeInTheDocument()
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
