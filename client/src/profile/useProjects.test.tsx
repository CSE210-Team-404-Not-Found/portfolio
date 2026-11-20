import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useProjects } from './useProjects.ts'

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
// listRecords gets whatever status and body the test passes in
function mockServers(listStatus: number, listBody: unknown) {
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = String(input instanceof Request ? input.url : input)
    if (url.startsWith('https://plc.directory/')) {
      const service = [
        { id: '#atproto_pds', type: 'AtprotoPersonalDataServer', serviceEndpoint: PDS },
      ]
      return new Response(JSON.stringify({ id: DID, service }), { status: 200 })
    }
    if (url.includes('com.atproto.repo.listRecords')) {
      return new Response(JSON.stringify(listBody), { status: listStatus })
    }
    return new Response('{}', { status: 404 })
  })
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useProjects', () => {
  it('loads their projects with a thumbnail url', async () => {
    mockServers(200, {
      records: [
        {
          uri: `at://${DID}/com.at-folio.temp.project/3lbreal01`,
          cid: 'cid1',
          value: {
            title: 'Bike Map',
            summary: 'Bike racks on campus',
            thumbnail: {
              $type: 'blob',
              ref: { $link: 'bafkreithumb' },
              mimeType: 'image/png',
              size: 10,
            },
          },
        },
      ],
    })

    const { result } = renderHook(() => useProjects(DID), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const [project] = result.current.data!
    expect(project.rkey).toBe('3lbreal01')
    expect(project.title).toBe('Bike Map')
    expect(project.summary).toBe('Bike racks on campus')
    expect(project.thumbnailUrl).toContain('cid=bafkreithumb')
  })

  it('gives back an empty list when they have no projects', async () => {
    mockServers(200, { records: [] })

    const { result } = renderHook(() => useProjects(DID), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual([])
  })

  it('errors when their pds is down', async () => {
    mockServers(500, {})

    const { result } = renderHook(() => useProjects(DID), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it("doesn't fetch anything until it has a did", () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')

    renderHook(() => useProjects(undefined), { wrapper: makeWrapper() })

    expect(fetchMock).not.toHaveBeenCalled()
  })
})
