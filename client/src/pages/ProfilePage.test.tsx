import { screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderAt } from '../test/render-at.tsx'

const DID = 'did:plc:alice'
const PDS = 'https://pds.example.com'

// a project record like the ones on someone's pds
function projectRecord(rkey: string, title: string, summary: string) {
  return {
    uri: `at://${DID}/com.at-folio.temp.project/${rkey}`,
    cid: rkey,
    value: { title, summary },
  }
}

const twoProjects = [
  projectRecord('3lbreal01', 'Bike Map', 'Bike racks around campus'),
  projectRecord('3lbreal02', 'Study Bot', 'Pairs up classmates before exams'),
]

// fakes bluesky's getProfile plus plc.directory and their pds so the tests don't hit the internet
// projects are what listRecords sends back
function mockProfileResponse(
  status: number,
  body: unknown,
  projects: unknown[] = twoProjects,
  projectsStatus = 200,
) {
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = String(input instanceof Request ? input.url : input)
    if (url.includes('app.bsky.actor.getProfile')) {
      return new Response(JSON.stringify(body), { status })
    }
    if (url.startsWith('https://plc.directory/')) {
      const service = [
        { id: '#atproto_pds', type: 'AtprotoPersonalDataServer', serviceEndpoint: PDS },
      ]
      return new Response(JSON.stringify({ id: DID, service }), { status: 200 })
    }
    if (url.includes('com.atproto.repo.listRecords')) {
      return new Response(JSON.stringify({ records: projects }), { status: projectsStatus })
    }
    return new Response('{}', { status: 404 })
  })
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ProfilePage', () => {
  it('shows the name and handle', async () => {
    mockProfileResponse(200, { did: DID, handle: 'alice.test', displayName: 'Alice' })
    renderAt('/profile/alice.test')

    expect(await screen.findByRole('heading', { level: 1, name: 'Alice' })).toBeInTheDocument()
    expect(screen.getByText('@alice.test')).toBeInTheDocument()
  })

  it('uses the handle as the name when there is no display name', async () => {
    mockProfileResponse(200, { did: DID, handle: 'alice.test' })
    renderAt('/profile/alice.test')

    expect(
      await screen.findByRole('heading', { level: 1, name: 'alice.test' }),
    ).toBeInTheDocument()
  })

  it('shows the job title, intro and links from the mock data', async () => {
    mockProfileResponse(200, { did: DID, handle: 'alice.test', displayName: 'Alice' })
    renderAt('/profile/alice.test')

    expect(await screen.findByText('Student developer')).toBeInTheDocument()
    expect(screen.getByText(/Placeholder intro/)).toBeInTheDocument()
    // links open in a new tab so you don't lose the profile
    const linkedin = screen.getByRole('link', { name: /LinkedIn/ })
    expect(linkedin).toHaveAttribute('href', 'https://www.linkedin.com/')
    expect(linkedin).toHaveAttribute('target', '_blank')
  })

  it('has a top bar that jumps to the sections and a footer', async () => {
    mockProfileResponse(200, { did: DID, handle: 'alice.test', displayName: 'Alice' })
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

  it('shows numbered project cards from their pds that link to each project', async () => {
    mockProfileResponse(200, { did: DID, handle: 'alice.test', displayName: 'Alice' })
    renderAt('/profile/alice.test')

    expect(await screen.findByRole('heading', { name: 'Bike Map' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Bike racks around campus/ })).toHaveAttribute(
      'href',
      '/profile/alice.test/project/3lbreal01',
    )
    // numbered like the figma
    expect(screen.getByText('01')).toBeInTheDocument()
    expect(screen.getByText('02')).toBeInTheDocument()
  })

  it('says no projects yet when they have none', async () => {
    mockProfileResponse(200, { did: DID, handle: 'alice.test', displayName: 'Alice' }, [])
    renderAt('/profile/alice.test')

    expect(await screen.findByText('No projects yet.')).toBeInTheDocument()
  })

  it('still shows the profile when the projects fail to load', async () => {
    mockProfileResponse(200, { did: DID, handle: 'alice.test', displayName: 'Alice' }, [], 500)
    renderAt('/profile/alice.test')

    expect(await screen.findByText("Couldn't load projects.")).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Alice' })).toBeInTheDocument()
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
