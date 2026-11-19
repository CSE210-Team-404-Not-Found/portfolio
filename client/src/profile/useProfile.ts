import { useQuery } from '@tanstack/react-query'

const GET_PROFILE_URL = 'https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile'

export type Profile = {
  did?: string
  handle?: string
  displayName?: string
  description?: string
  avatar?: string
}

/** Loads a user's public Bluesky profile by DID or handle. */
export function useProfile(actor: string) {
  return useQuery({
    queryKey: ['profile', actor],
    queryFn: async (): Promise<Profile> => {
      // getProfile takes either a did or a handle for actor
      const response = await fetch(`${GET_PROFILE_URL}?actor=${encodeURIComponent(actor)}`)
      if (!response.ok) throw new Error(`Profile request failed with ${response.status}`)
      return response.json()
    },
    staleTime: 5 * 60 * 1000,
  })
}
