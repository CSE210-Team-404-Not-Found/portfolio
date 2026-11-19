// finds which server (PDS) someone's account lives on so we can read their records from it
// reference: https://atproto.com/specs/did

const PLC_DIRECTORY = 'https://plc.directory'

type DidDocument = {
  service?: { id: string; type: string; serviceEndpoint: string }[]
}

// most bluesky accounts are did:plc which plc.directory knows about
// did:web ones keep their document on their own domain
function didDocumentUrl(did: string): string {
  if (did.startsWith('did:plc:')) {
    return `${PLC_DIRECTORY}/${did}`
  }
  if (did.startsWith('did:web:')) {
    const domain = did.slice('did:web:'.length)
    return `https://${domain}/.well-known/did.json`
  }
  throw new Error(`Unsupported DID: ${did}`)
}

export async function getPdsUrl(did: string): Promise<string> {
  const response = await fetch(didDocumentUrl(did))
  if (!response.ok) throw new Error(`Couldn't look up ${did} (${response.status})`)

  const doc: DidDocument = await response.json()

  // the pds is listed under services with this id
  for (const service of doc.service ?? []) {
    if (service.id.endsWith('#atproto_pds')) {
      return service.serviceEndpoint
    }
  }
  throw new Error(`${did} doesn't list a PDS`)
}
