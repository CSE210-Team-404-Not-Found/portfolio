import { useQuery } from '@tanstack/react-query'
import { getBlobUrl, type BlobRef } from './blob-url.ts'
import { getRecord } from './read-records.ts'
import { getPdsUrl } from './resolve-pds.ts'

const PROFILE_COLLECTION = 'com.at-folio.temp.profile'

// the fields in Max's profile lexicon
type PortfolioProfileRecord = {
  fullName?: string
  jobTitle?: string
  description?: string
  avatar?: BlobRef
}

export type PortfolioProfile = {
  fullName?: string
  jobTitle?: string
  description?: string
  avatarUrl?: string
}

/** Loads someone's portfolio profile (not their bluesky one) from their PDS. */
export function usePortfolioProfile(did: string | undefined) {
  return useQuery({
    queryKey: ['portfolioProfile', did],
    queryFn: async (): Promise<PortfolioProfile | null> => {
      const pdsUrl = await getPdsUrl(did!)
      // there's only ever one so it always lives at rkey "self"
      const record = await getRecord<PortfolioProfileRecord>(
        pdsUrl,
        did!,
        PROFILE_COLLECTION,
        'self',
      )

      // they have a bluesky account but haven't set up a portfolio yet
      if (!record) return null

      const { avatar, ...rest } = record.value
      return { ...rest, avatarUrl: avatar && getBlobUrl(pdsUrl, did!, avatar) }
    },
    // the did comes from their bluesky profile so wait until that has loaded
    enabled: !!did,
    staleTime: 5 * 60 * 1000,
  })
}
