import { useQuery } from '@tanstack/react-query'

const GET_PROFILE_URL = 'https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile'

export type Profile = {
  displayName?: string
  avatar?: string
}

/** Loads a user's public profile (display name and avatar) by DID. */
export function useProfile(did: string) {
  return useQuery({
    queryKey: ['profile', did],
    queryFn: async (): Promise<Profile> => {
      const response = await fetch(`${GET_PROFILE_URL}?actor=${encodeURIComponent(did)}`)
      if (!response.ok) throw new Error(`Profile request failed with ${response.status}`)
      return response.json()
    },
    staleTime: 5 * 60 * 1000,
  })
}
