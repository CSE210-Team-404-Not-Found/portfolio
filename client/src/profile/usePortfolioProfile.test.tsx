import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { usePortfolioProfile } from './usePortfolioProfile.ts'

const DID = 'did:plc:abc123'
const PDS = 'https://pds.example.com'

// no retries here so the error test doesn't sit and wait
function makeWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

// fakes plc.directory and their pds
// getRecord gets whatever status and body the test passes in
function mockServers(recordStatus: number, recordBody: unknown) {
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = String(input instanceof Request ? input.url : input)
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

describe('usePortfolioProfile', () => {
  it('loads their portfolio profile with an avatar url', async () => {
    mockServers(200, {
      uri: `at://${DID}/com.at-folio.temp.profile/self`,
      cid: 'cid1',
      value: {
        fullName: 'Alice Smith',
        jobTitle: 'Student developer',
        description: 'I make things',
        avatar: { $type: 'blob', ref: { $link: 'bafkreiavatar' }, mimeType: 'image/png', size: 10 },
      },
    })

    const { result } = renderHook(() => usePortfolioProfile(DID), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const profile = result.current.data!
    expect(profile.fullName).toBe('Alice Smith')
    expect(profile.jobTitle).toBe('Student developer')
    expect(profile.description).toBe('I make things')
    expect(profile.avatarUrl).toContain('cid=bafkreiavatar')
  })

  it("gives back null when they haven't made a portfolio profile", async () => {
    // what the pds sends for a record that isn't there
    mockServers(400, { error: 'RecordNotFound' })

    const { result } = renderHook(() => usePortfolioProfile(DID), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toBeNull()
  })

  it('errors when their pds is down', async () => {
    mockServers(500, {})

    const { result } = renderHook(() => usePortfolioProfile(DID), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it("doesn't fetch anything until it has a did", () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')

    renderHook(() => usePortfolioProfile(undefined), { wrapper: makeWrapper() })

    expect(fetchMock).not.toHaveBeenCalled()
  })
})
