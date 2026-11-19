// turns an image in a record (like a project thumbnail or avatar) into a url the page can show
// reference: https://atproto.com/specs/data-model#blob-type

// how a blob looks inside a record
// older records use the legacy shape with just a cid string
export type BlobRef =
  | { $type: 'blob'; ref: { $link: string }; mimeType: string; size: number }
  | { cid: string; mimeType: string }

function blobCid(blob: BlobRef): string {
  if ('ref' in blob) return blob.ref.$link
  return blob.cid
}

// the image itself lives on their pds and getBlob hands it back by its cid
export function getBlobUrl(pdsUrl: string, did: string, blob: BlobRef): string {
  const params = new URLSearchParams({ did, cid: blobCid(blob) })
  return `${pdsUrl}/xrpc/com.atproto.sync.getBlob?${params}`
}
