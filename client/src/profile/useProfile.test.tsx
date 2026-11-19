import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useProfile } from './useProfile.ts'

// useQuery needs a QueryClient around it
// new one every time so a profile cached in one test doesn't show up in another
function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient()
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useProfile', () => {
  it('looks up a profile by handle', async () => {
    // fake bluesky's response so the test doesn't hit the internet
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify({ handle: 'alice.test', description: 'hi' }), { status: 200 }),
      )

    const { result } = renderHook(() => useProfile('alice.test'), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // should've asked bluesky for the handle we passed in
    expect(String(fetchMock.mock.calls[0][0])).toContain('actor=alice.test')
    expect(result.current.data?.handle).toBe('alice.test')
    expect(result.current.data?.description).toBe('hi')
  })
})
