import { describe, expect, it } from 'vitest'
import { getBlobUrl } from './blob-url.ts'

const PDS = 'https://pds.example.com'
const DID = 'did:plc:abc123'

describe('getBlobUrl', () => {
  it('builds a getBlob url from a blob in a record', () => {
    const blob = {
      $type: 'blob' as const,
      ref: { $link: 'bafkreiabc' },
      mimeType: 'image/png',
      size: 1234,
    }

    const url = new URL(getBlobUrl(PDS, DID, blob))
    expect(url.origin).toBe(PDS)
    expect(url.pathname).toBe('/xrpc/com.atproto.sync.getBlob')
    expect(url.searchParams.get('did')).toBe(DID)
    expect(url.searchParams.get('cid')).toBe('bafkreiabc')
  })

  it('works with the older blob shape too', () => {
    const url = new URL(getBlobUrl(PDS, DID, { cid: 'bafkreiold', mimeType: 'image/jpeg' }))
    expect(url.searchParams.get('cid')).toBe('bafkreiold')
  })
})
