import { screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderAt } from '../test/render-at.tsx'

const DID = 'did:plc:alice'
const PDS = 'https://pds.example.com'

// fakes bluesky's getProfile plus plc.directory and their pds
// getRecord gets whatever status and body the test passes in
function mockServers(recordStatus: number, recordBody: unknown) {
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = String(input instanceof Request ? input.url : input)
    if (url.includes('app.bsky.actor.getProfile')) {
      return new Response(JSON.stringify({ did: DID, handle: 'alice.test' }), { status: 200 })
    }
    if (url.startsWith('https://plc.directory/')) {
      const service = [
        { id: '#atproto_pds', type: 'AtprotoPersonalDataServer', serviceEndpoint: PDS },
      ]
      return new Response(JSON.stringify({ id: DID, service }), { status: 200 })
    }
    if (url.includes('com.atproto.repo.getRecord')) {
      return new Response(JSON.stringify(recordBody), { status: recordStatus })
    }
    return new Response('{}', { status: 404 })
  })
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ProjectPage', () => {
  it('shows the project title and a link back to the profile', async () => {
    mockServers(200, {
      uri: `at://${DID}/com.at-folio.temp.project/3lbreal01`,
      cid: 'cid1',
      value: { title: 'Bike Map', summary: 'Bike racks around campus' },
    })
    renderAt('/profile/alice.test/project/3lbreal01')

    expect(await screen.findByRole('heading', { level: 1, name: 'Bike Map' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Back to @alice\.test/ })).toHaveAttribute(
      'href',
      '/profile/alice.test',
    )
  })

  it('says so when the project does not exist', async () => {
    // what the pds sends for a record that isn't there
    mockServers(400, { error: 'RecordNotFound' })
    renderAt('/profile/alice.test/project/nothinghere')

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Project not found' }),
    ).toBeInTheDocument()
  })
})
