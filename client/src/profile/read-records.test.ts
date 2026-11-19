import { afterEach, describe, expect, it, vi } from 'vitest'
import { getRecord, listRecords } from './read-records.ts'

const PDS = 'https://pds.example.com'
const DID = 'did:plc:abc123'
const PROJECTS = 'com.at-folio.temp.project'

function record(rkey: string, title: string) {
  return {
    uri: `at://${DID}/${PROJECTS}/${rkey}`,
    cid: `cid-${rkey}`,
    value: { title },
  }
}

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status })
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('listRecords', () => {
  it('gets the records in a collection', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse(200, { records: [record('a', 'First')] }))

    const records = await listRecords<{ title: string }>(PDS, DID, PROJECTS)

    expect(records.map((r) => r.value.title)).toEqual(['First'])
    const url = new URL(String(fetchMock.mock.calls[0][0]))
    expect(url.pathname).toBe('/xrpc/com.atproto.repo.listRecords')
    expect(url.searchParams.get('repo')).toBe(DID)
    expect(url.searchParams.get('collection')).toBe(PROJECTS)
  })

  it('keeps going while the pds gives back a cursor', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse(200, { records: [record('a', 'First')], cursor: 'next' }))
      .mockResolvedValueOnce(jsonResponse(200, { records: [record('b', 'Second')] }))

    const records = await listRecords<{ title: string }>(PDS, DID, PROJECTS)

    expect(records.map((r) => r.value.title)).toEqual(['First', 'Second'])
    expect(fetchMock).toHaveBeenCalledTimes(2)
    const secondUrl = new URL(String(fetchMock.mock.calls[1][0]))
    expect(secondUrl.searchParams.get('cursor')).toBe('next')
  })

  it('throws when the pds errors', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(500, {}))

    await expect(listRecords(PDS, DID, PROJECTS)).rejects.toThrow(/Couldn't list/)
  })
})

describe('getRecord', () => {
  it('gets one record by rkey', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse(200, record('self', 'Me')))

    const result = await getRecord<{ title: string }>(PDS, DID, PROJECTS, 'self')

    expect(result?.value.title).toBe('Me')
    const url = new URL(String(fetchMock.mock.calls[0][0]))
    expect(url.pathname).toBe('/xrpc/com.atproto.repo.getRecord')
    expect(url.searchParams.get('rkey')).toBe('self')
  })

  it("gives back null when the record doesn't exist", async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(400, { error: 'RecordNotFound' }))

    expect(await getRecord(PDS, DID, PROJECTS, 'self')).toBeNull()
  })
})
