import { describe, expect, it, vi } from 'vitest'
import { Client, getBlobCidString, parseCid } from '@atproto/lex'
import type { JSONContent } from '@tiptap/core'
import projectLexicon from '../lexicons/com/at-folio/temp/project.js'
import { isYoutubeUrl } from './extensions.ts'
import { dataUrlBlob, hydrateDocument, prepareDocument, validateMedia, type MediaRef } from './media.ts'

const image = 'data:image/png;base64,aGVsbG8='
const document = (src = image): JSONContent => ({ type: 'doc', content: [{ type: 'image', attrs: { src, alt: 'Example' } }] })
const ref = { $type: 'blob', ref: { $link: 'bafkreigh2akiscaildc3acisqya3f3d3m7xdq5yua4f4wzfr5c5cf4uyfe' }, mimeType: 'image/png', size: 5 } as unknown as MediaRef

describe('project media storage', () => {
  it('stores separate file references and reopens them from the current PDS', async () => {
    const uploadBlob = vi.fn().mockResolvedValue({ body: { blob: ref } })
    const getBlob = vi.fn().mockResolvedValue({ body: new TextEncoder().encode('hello') })
    const client = { uploadBlob, getBlob } as unknown as Client
    const result = await prepareDocument(document(), client, 'did:plc:alice', 'https://my-pds.example', [])
    expect(uploadBlob).toHaveBeenCalledOnce()
    expect(result.media).toEqual([ref])
    expect(JSON.stringify(result.document)).not.toContain('data:')
    expect(result.document.content![0].attrs?.src).toContain('https://my-pds.example/xrpc/com.atproto.sync.getBlob?did=did%3Aplc%3Aalice&cid=')
    const hydrated = await hydrateDocument(result.document, client, 'did:plc:alice', result.media)
    expect(hydrated.content![0].attrs?.src).toBe(image)
    expect(getBlob).toHaveBeenCalledWith('did:plc:alice', getBlobCidString(ref))
    const savedAgain = await prepareDocument(hydrated, client, 'did:plc:alice', 'https://new-pds.example', result.media)
    expect(uploadBlob).toHaveBeenCalledOnce()
    expect(savedAgain.document.content![0].attrs?.src).toContain('https://new-pds.example/')
  })

  it('accepts server-detected video/webm for an audio recording and can reopen it', async () => {
    const recordingRef: MediaRef = {
      $type: 'blob',
      ref: parseCid('bafkreigh2akiscaildc3acisqya3f3d3m7xdq5yua4f4wzfr5c5cf4uyfe'),
      mimeType: 'video/webm', size: 5,
    }
    const uploadBlob = vi.fn().mockResolvedValue({ body: { blob: recordingRef } })
    const getBlob = vi.fn().mockResolvedValue({ body: new TextEncoder().encode('hello') })
    const client = { uploadBlob, getBlob } as unknown as Client
    const audio: JSONContent = { type: 'doc', content: [{ type: 'audioRecording', attrs: { src: 'data:audio/webm;base64,aGVsbG8=' } }] }
    const prepared = await prepareDocument(audio, client, 'did:plc:alice', 'https://pds.example', [])
    const record = { $type: 'com.at-folio.temp.project', title: 'Recording', summary: 'Audio', media: prepared.media }
    // Validate with the generated lexicon, not a mock of create/put.
    expect(() => projectLexicon.parse(record)).not.toThrow()
    expect(prepared.media[0].mimeType).toBe('video/webm')
    const restored = await hydrateDocument(prepared.document, client, 'did:plc:alice', prepared.media)
    expect(restored.content![0].attrs?.src).toBe('data:video/webm;base64,aGVsbG8=')
    const savedAgain = await prepareDocument(restored, client, 'did:plc:alice', 'https://pds.example', prepared.media)
    expect(() => projectLexicon.parse({ ...record, media: savedAgain.media })).not.toThrow()
    expect(uploadBlob).toHaveBeenCalledOnce()
    expect(() => validateMedia({ type: 'doc', content: [{ type: 'audioRecording', attrs: { src: 'data:video/mp4;base64,aGVsbG8=' } }] })).toThrow('Unsupported media type')
  })

  it('deduplicates uploads and drops deleted media references', async () => {
    const uploadBlob = vi.fn().mockResolvedValue({ body: { blob: ref } })
    const client = { uploadBlob } as unknown as Client
    const duplicate: JSONContent = { type: 'doc', content: [document().content![0], document().content![0]] }
    expect((await prepareDocument(duplicate, client, 'did:plc:alice', 'https://pds.example', [])).media).toHaveLength(1)
    expect(uploadBlob).toHaveBeenCalledOnce()
    expect((await prepareDocument({ type: 'doc' }, client, 'did:plc:alice', 'https://pds.example', [ref])).media).toEqual([])
  })

  it('accepts supported YouTube links and rejects lookalike hosts and missing video IDs', () => {
    expect(isYoutubeUrl('https://www.youtube.com/watch?v=abcdefghijk')).toBe(true)
    expect(isYoutubeUrl('https://youtu.be/abcdefghijk?t=12')).toBe(true)
    expect(isYoutubeUrl('https://www.youtube-nocookie.com/embed/abcdefghijk')).toBe(true)
    expect(isYoutubeUrl('https://youtube.com.evil.example/watch?v=abcdefghijk')).toBe(false)
    expect(isYoutubeUrl('https://youtube.com/watch?v=')).toBe(false)
  })

  it('rejects unsafe sources, unsupported data, image count, and file sizes', () => {
    expect(() => validateMedia(document('javascript:alert(1)'))).toThrow()
    expect(() => validateMedia(document('data:image/svg+xml;base64,aGVsbG8='))).toThrow('Unsupported media type')
    expect(() => validateMedia({ type: 'doc', content: Array.from({ length: 6 }, () => document().content![0]) })).toThrow('up to 5 images')
    expect(() => validateMedia(document(`data:image/png;base64,${btoa('x'.repeat(1024 * 1024 + 1))}`))).toThrow('1 MB')
    expect(dataUrlBlob('data:audio/webm;codecs=opus;base64,aGVsbG8=').type).toBe('audio/webm;codecs=opus')
  })
})
