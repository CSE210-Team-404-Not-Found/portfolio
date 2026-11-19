import { useQuery } from '@tanstack/react-query'

const GET_PROFILE_URL = 'https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile'

export type Profile = {
  did?: string
  handle?: string
  displayName?: string
  description?: string
  avatar?: string
}

// so the profile page can tell "no such account" apart from the server being down
export class ProfileNotFoundError extends Error {
  constructor() {
    super('Profile not found')
    this.name = 'ProfileNotFoundError'
  }
}

/** Loads a user's public Bluesky profile by DID or handle. */
export function useProfile(actor: string) {
  return useQuery({
    queryKey: ['profile', actor],
    queryFn: async (): Promise<Profile> => {
      // getProfile takes either a did or a handle for actor
      const response = await fetch(`${GET_PROFILE_URL}?actor=${encodeURIComponent(actor)}`)
      // bluesky sends back a 400 when the handle doesn't exist
      if (response.status === 400) throw new ProfileNotFoundError()
      if (!response.ok) throw new Error(`Profile request failed with ${response.status}`)
      return response.json()
    },
    // no point retrying if the account doesn't exist but anything else gets up to 3 tries
    retry: (failureCount, error) => {
      if (error instanceof ProfileNotFoundError) {
        return false
      }
      return failureCount < 3
    },
    staleTime: 5 * 60 * 1000,
  })
}
