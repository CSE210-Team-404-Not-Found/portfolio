import { afterEach, describe, expect, it, vi } from 'vitest'
import { getPdsUrl } from './resolve-pds.ts'

// trimmed down version of what plc.directory actually sends back
const didDoc = {
  id: 'did:plc:abc123',
  service: [
    {
      id: '#atproto_pds',
      type: 'AtprotoPersonalDataServer',
      serviceEndpoint: 'https://pds.example.com',
    },
  ],
}

function mockFetch(status: number, body: unknown) {
  return vi
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue(new Response(JSON.stringify(body), { status }))
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('getPdsUrl', () => {
  it('finds the pds for a did:plc from plc.directory', async () => {
    const fetchMock = mockFetch(200, didDoc)

    expect(await getPdsUrl('did:plc:abc123')).toBe('https://pds.example.com')
    expect(String(fetchMock.mock.calls[0][0])).toBe('https://plc.directory/did:plc:abc123')
  })

  it('finds the pds for a did:web from their own domain', async () => {
    const fetchMock = mockFetch(200, didDoc)

    expect(await getPdsUrl('did:web:alice.example.com')).toBe('https://pds.example.com')
    expect(String(fetchMock.mock.calls[0][0])).toBe(
      'https://alice.example.com/.well-known/did.json',
    )
  })

  it("throws when the did can't be found", async () => {
    mockFetch(404, {})

    await expect(getPdsUrl('did:plc:nobody')).rejects.toThrow(/Couldn't look up/)
  })

  it("throws when the did document doesn't list a pds", async () => {
    mockFetch(200, { id: 'did:plc:abc123', service: [] })

    await expect(getPdsUrl('did:plc:abc123')).rejects.toThrow(/doesn't list a PDS/)
  })

  it('throws for a kind of did we do not support', async () => {
    await expect(getPdsUrl('did:key:whatever')).rejects.toThrow(/Unsupported DID/)
  })
})
