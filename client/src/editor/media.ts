import { getBlobCidString, getBlobMime, type Client, type DidString } from '@atproto/lex'
import type { JSONContent } from '@tiptap/core'
import type { Main as ProjectRecord } from '../lexicons/com/at-folio/temp/project.js'
import { isYoutubeUrl } from './extensions.ts'

export const MAX_MEDIA_SIZE = 10 * 1024 * 1024
export const MAX_DOCUMENT_SIZE = 500_000
export type MediaRef = NonNullable<ProjectRecord['media']>[number]
const mediaTypes = new Set(['image', 'audioRecording', 'model3d'])
export function readDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Could not read this file.'))
    reader.readAsDataURL(blob)
  })
}
export function dataUrlBlob(src: string) {
  const match = /^data:([^,]+);base64,([a-z0-9+/=\s]*)$/i.exec(src)
  if (!match) throw new Error('Unsupported media format.')
  const bytes = Uint8Array.from(atob(match[2]), character => character.charCodeAt(0))
  return new Blob([bytes], { type: match[1] })
}
export function walkDocument(document: JSONContent, visit: (node: JSONContent) => void) {
  visit(document)
  document.content?.forEach(node => walkDocument(node, visit))
}
export function validateMedia(document: JSONContent) {
  let count = 0
  let images = 0
  let totalBytes = 0
  walkDocument(document, node => {
    for (const mark of node.marks ?? []) {
      if (mark.type === 'link' && !/^(https?:\/\/|mailto:)/i.test(String(mark.attrs?.href))) throw new Error('Use an http://, https://, or mailto: link.')
    }
    if (node.type === 'youtube' && !isYoutubeUrl(String(node.attrs?.src))) throw new Error('Use a YouTube video URL.')
    if (!mediaTypes.has(node.type ?? '')) return
    count++
    if (node.type === 'image') images++
    const src = String(node.attrs?.src ?? '')
    if (src.startsWith('https://')) return
    const blob = dataUrlBlob(src)
    totalBytes += blob.size
    const validMime = node.type === 'image' ? /^image\/(png|jpeg|webp|gif)$/ : node.type === 'audioRecording' ? /^(audio\/(webm|ogg|mp4|mpeg|wav)|video\/webm)(;.*)?$/ : /^model\/gltf-binary$/
    if (!validMime.test(blob.type)) throw new Error('Unsupported media type.')
    if (blob.size > (node.type === 'image' ? 1024 * 1024 : MAX_MEDIA_SIZE)) throw new Error('Images must be 1 MB or smaller; audio and 3D files must be 10 MB or smaller.')
  })
  if (totalBytes > 20 * 1024 * 1024) throw new Error('Keep embedded media under 20 MB in total.')
  if (images > 5) throw new Error('Add up to 5 images per project.')
  if (count > 20) throw new Error('Add up to 20 media blocks per project.')
}
/** Keep real blob references on the record so the PDS retains the media. */
export async function prepareDocument(document: JSONContent, client: Client, did: string, pds: string, existing: MediaRef[]) {
  validateMedia(document)
  const saved = structuredClone(document)
  const nodes: JSONContent[] = []
  walkDocument(saved, node => { if (mediaTypes.has(node.type ?? '')) nodes.push(node) })
  const media: MediaRef[] = []
  const uploaded = new Map<string, MediaRef>()
  for (const node of nodes) {
    const src = String(node.attrs?.src ?? '')
    let ref = existing.find(ref => getBlobCidString(ref) === node.attrs?.mediaCid)
    if (!ref && src.startsWith('data:')) {
      ref = uploaded.get(src)
      if (!ref) {
        const blob = dataUrlBlob(src)
        ref = (await client.uploadBlob(blob, { encoding: blob.type as `${string}/${string}` })).body.blob
        uploaded.set(src, ref)
      }
    }
    if (ref) {
      const cid = getBlobCidString(ref)
      if (!cid) throw new Error('Could not save this media file.')
      if (!media.some(item => getBlobCidString(item) === cid)) media.push(ref)
      const url = new URL('/xrpc/com.atproto.sync.getBlob', pds)
      url.searchParams.set('did', did)
      url.searchParams.set('cid', cid)
      node.attrs = { ...node.attrs, src: url.href, mediaCid: cid }
    }
  }
  return { document: saved, media }
}
/** Resolve from the current PDS when reopening, rather than an old host URL. */
export async function hydrateDocument(document: JSONContent, client: Client, did: string, refs: MediaRef[]) {
  const hydrated = structuredClone(document)
  const nodes: JSONContent[] = []
  walkDocument(hydrated, node => { if (mediaTypes.has(node.type ?? '') && node.attrs?.mediaCid) nodes.push(node) })
  for (const node of nodes) {
    const ref = refs.find(ref => getBlobCidString(ref) === node.attrs?.mediaCid)
    if (!ref) throw new Error('A media reference is missing from this project.')
    const response = await client.getBlob(did as DidString, getBlobCidString(ref)!)
    node.attrs = { ...node.attrs, src: await readDataUrl(new Blob([response.body.slice().buffer as ArrayBuffer], { type: getBlobMime(ref) })) }
  }
  validateMedia(hydrated)
  return hydrated
}

export async function insertMediaFile(editor: import('@tiptap/core').Editor, file: File, position?: number) {
  let type: string
  let blob: Blob = file
  if (['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type)) {
    if (file.size > 1024 * 1024) throw new Error('Images must be 1 MB or smaller.')
    type = 'image'
  } else if (/\.glb$/i.test(file.name)) {
    if (file.size > MAX_MEDIA_SIZE) throw new Error('3D files must be 10 MB or smaller.')
    const buffer = await file.slice(0, 12).arrayBuffer()
    const header = new DataView(buffer)
    if (buffer.byteLength !== 12 || header.getUint32(0, true) !== 0x46546c67 || header.getUint32(4, true) !== 2 || header.getUint32(8, true) !== file.size) throw new Error('Choose a valid GLB 2.0 file.')
    blob = new Blob([file], { type: 'model/gltf-binary' })
    type = 'model3d'
    await import('@google/model-viewer')
  } else {
    throw new Error('Choose a PNG, JPEG, WebP, GIF, or GLB file.')
  }
  const node = { type, attrs: { src: await readDataUrl(blob), alt: file.name.replace(/\.[^.]+$/, '') } }
  const candidate = editor.getJSON()
  candidate.content = [...(candidate.content ?? []), node]
  validateMedia(candidate)
  if (editor.isDestroyed) return
  editor.chain().focus().insertContentAt(position ?? editor.state.selection.to, node).run()
}
