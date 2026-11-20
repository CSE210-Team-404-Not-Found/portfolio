import { useQuery } from '@tanstack/react-query'
import { getBlobUrl, type BlobRef } from './blob-url.ts'
import { listRecords } from './read-records.ts'
import { getPdsUrl } from './resolve-pds.ts'

const PROJECT_COLLECTION = 'com.at-folio.temp.project'

// the fields we use from Max's project lexicon
type ProjectRecord = {
  title: string
  summary?: string
  thumbnail?: BlobRef
}

// same shape as MockProject so the cards don't have to change
export type Project = {
  rkey: string
  title: string
  summary: string
  thumbnailUrl?: string
}

/** Loads someone's public projects straight from their PDS. */
export function useProjects(did: string | undefined) {
  return useQuery({
    queryKey: ['projects', did],
    queryFn: async (): Promise<Project[]> => {
      const pdsUrl = await getPdsUrl(did!)
      const records = await listRecords<ProjectRecord>(pdsUrl, did!, PROJECT_COLLECTION)

      return records.map((record) => ({
        // the uri ends in the rkey (at://did/collection/rkey)
        rkey: record.uri.split('/').pop()!,
        title: record.value.title,
        summary: record.value.summary ?? '',
        thumbnailUrl: record.value.thumbnail && getBlobUrl(pdsUrl, did!, record.value.thumbnail),
      }))
    },
    // the did comes from their bluesky profile so wait until that has loaded
    enabled: !!did,
    staleTime: 5 * 60 * 1000,
  })
}
