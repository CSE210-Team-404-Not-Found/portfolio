import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ProfileNotFoundError, useProfile } from './useProfile.ts'

// useQuery needs a QueryClient around it
// new one for every test so a profile cached in one test doesn't show up in another
// (had it inside the wrapper before but then it made a new one every rerender)
function makeWrapper() {
  const queryClient = new QueryClient()
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
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

    const { result } = renderHook(() => useProfile('alice.test'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // should've asked bluesky for the handle we passed in
    expect(String(fetchMock.mock.calls[0][0])).toContain('actor=alice.test')
    expect(result.current.data?.handle).toBe('alice.test')
    expect(result.current.data?.description).toBe('hi')
  })

  it('gives a ProfileNotFoundError when the handle does not exist', async () => {
    // this is what bluesky actually sends back for a handle nobody has
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify({ error: 'InvalidRequest', message: 'Profile not found' }), {
          status: 400,
        }),
      )

    const { result } = renderHook(() => useProfile('nobody.test'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toBeInstanceOf(ProfileNotFoundError)
    // only asked once since retrying wouldn't help
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
