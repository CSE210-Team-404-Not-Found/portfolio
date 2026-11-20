import { useQuery } from '@tanstack/react-query'
import { getBlobUrl, type BlobRef } from './blob-url.ts'
import { getRecord, listRecords, type PublicRecord } from './read-records.ts'
import { getPdsUrl } from './resolve-pds.ts'

const PROJECT_COLLECTION = 'com.at-folio.temp.project'

// the fields we use from Max's project lexicon
type ProjectRecord = {
  title: string
  summary?: string
  thumbnail?: BlobRef
}

// what the project cards and the project page show
export type Project = {
  rkey: string
  title: string
  summary: string
  thumbnailUrl?: string
}

// turns a record from their pds into what the cards and project page use
function toProject(pdsUrl: string, did: string, record: PublicRecord<ProjectRecord>): Project {
  return {
    // the uri ends in the rkey (at://did/collection/rkey)
    rkey: record.uri.split('/').pop()!,
    title: record.value.title,
    summary: record.value.summary ?? '',
    thumbnailUrl: record.value.thumbnail && getBlobUrl(pdsUrl, did, record.value.thumbnail),
  }
}

/** Loads someone's public projects straight from their PDS. */
export function useProjects(did: string | undefined) {
  return useQuery({
    queryKey: ['projects', did],
    queryFn: async (): Promise<Project[]> => {
      const pdsUrl = await getPdsUrl(did!)
      const records = await listRecords<ProjectRecord>(pdsUrl, did!, PROJECT_COLLECTION)
      return records.map((record) => toProject(pdsUrl, did!, record))
    },
    // the did comes from their bluesky profile so wait until that has loaded
    enabled: !!did,
    staleTime: 5 * 60 * 1000,
  })
}

/** Loads one project by its rkey. Gives back null if it doesn't exist. */
export function useProject(did: string | undefined, rkey: string) {
  return useQuery({
    queryKey: ['project', did, rkey],
    queryFn: async (): Promise<Project | null> => {
      const pdsUrl = await getPdsUrl(did!)
      const record = await getRecord<ProjectRecord>(pdsUrl, did!, PROJECT_COLLECTION, rkey)
      return record && toProject(pdsUrl, did!, record)
    },
    enabled: !!did,
    staleTime: 5 * 60 * 1000,
  })
}
