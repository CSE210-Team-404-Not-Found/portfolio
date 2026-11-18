import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ProjectEditor } from './ProjectEditor.tsx'

const { client, restoreSession } = vi.hoisted(() => ({
  client: {
    listAll: vi.fn(),
    create: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    uploadBlob: vi.fn(),
    getBlob: vi.fn(),
  },
  restoreSession: vi.fn(),
}))

vi.mock('@atproto/lex', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@atproto/lex')>()
  return {
    ...actual,
    Client: class { constructor() { return client } },
    getBlobCidString: (blob: { ref?: string }) => blob.ref,
    getBlobMime: () => 'image/png',
    XrpcResponseError: class extends Error {
      error: string
      status: number
      constructor(error: string, status = 500) { super(error); this.error = error; this.status = status }
    },
  }
})

vi.mock('../auth/oauth-client.ts', () => ({ restoreOAuthSession: restoreSession }))

const project = {
  $type: 'com.at-folio.temp.project',
  title: 'Portfolio site',
  summary: 'A personal site',
  thumbnail: { ref: 'thumbnail-cid' },
  tiptapJson: { ref: 'json-cid' },
  tiptapHtml: { ref: 'html-cid' },
}
const projectUri = 'at://did:example:alice/com.at-folio.temp.project/project-key'

describe('ProjectEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    restoreSession.mockResolvedValue({ did: 'did:example:alice' })
    client.listAll.mockImplementation(async function* () {
      yield { valid: true, uri: projectUri, value: project }
    })
    client.create.mockResolvedValue(undefined)
    client.put.mockResolvedValue(undefined)
    client.delete.mockResolvedValue(undefined)
    client.uploadBlob.mockImplementation(async (_blob: Blob, options: { encoding: string }) => ({
      body: { blob: { ref: `uploaded-${options.encoding}` } },
    }))
    client.getBlob.mockImplementation(async (_did: string, cid: string) => ({
      body: cid === 'thumbnail-cid' ? new Uint8Array([1, 2]) : new TextEncoder().encode(cid === 'json-cid' ? '{"type":"doc","content":[]}' : '<p>hello</p>'),
    }))
    vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:project'), revokeObjectURL: vi.fn() })
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('lists previews, loads a record for editing, and writes the update', async () => {
    render(<ProjectEditor did="did:example:alice" />)
    expect(await screen.findByText('Portfolio site')).toBeTruthy()
    expect(screen.getByAltText('Portfolio site thumbnail')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))

    expect(await screen.findByDisplayValue('Portfolio site')).toBeTruthy()
    expect(screen.getByDisplayValue('{"type":"doc","content":[]}')).toBeTruthy()
    expect(screen.getByDisplayValue('<p>hello</p>')).toBeTruthy()
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: '  Updated site  ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Update project' }))

    await waitFor(() => expect(client.put).toHaveBeenCalled())
    expect(client.put.mock.calls[0][1]).toMatchObject({ title: 'Updated site', summary: 'A personal site', thumbnail: project.thumbnail })
    expect(client.put.mock.calls[0][2]).toMatchObject({ rkey: 'project-key', validateRequest: true })
    expect(await screen.findByRole('status')).toBeTruthy()
  })

  it('creates a project and uploads its thumbnail and Tiptap blobs', async () => {
    client.listAll.mockImplementation(async function* () {})
    render(<ProjectEditor did="did:example:alice" />)
    await screen.findByText('No project records yet.')
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'New project' } })
    fireEvent.change(screen.getByLabelText('Summary'), { target: { value: 'New summary' } })
    fireEvent.change(screen.getByLabelText(/Tiptap JSON/), { target: { value: '{bad json' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create project' }))
    expect((await screen.findByRole('alert')).textContent).toContain('Tiptap JSON must be valid JSON.')
    expect(client.create).not.toHaveBeenCalled()

    fireEvent.change(screen.getByLabelText(/Tiptap JSON/), { target: { value: '{"type":"doc","content":[]}' } })
    fireEvent.change(screen.getByLabelText(/Tiptap HTML/), { target: { value: '<p>New</p>' } })
    fireEvent.change(screen.getByLabelText(/Thumbnail/), {
      target: { files: [new File(['image'], 'thumb.png', { type: 'image/png' })] },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create project' }))

    await waitFor(() => expect(client.create).toHaveBeenCalled())
    expect(client.uploadBlob).toHaveBeenCalledTimes(3)
    expect(client.create.mock.calls[0][1]).toMatchObject({
      title: 'New project',
      summary: 'New summary',
      thumbnail: { ref: 'uploaded-image/png' },
      tiptapJson: { ref: 'uploaded-application/json' },
      tiptapHtml: { ref: 'uploaded-text/html' },
    })
  })

  it('rejects unsupported thumbnails and deletes a project', async () => {
    render(<ProjectEditor did="did:example:alice" />)
    await screen.findByText('Portfolio site')
    fireEvent.change(screen.getByLabelText(/Thumbnail/), {
      target: { files: [new File(['file'], 'file.svg', { type: 'image/svg+xml' })] },
    })
    expect(screen.getByRole('alert').textContent).toContain('Choose a JPEG, PNG, WebP, or GIF thumbnail.')
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(client.delete).toHaveBeenCalledWith(expect.anything(), { rkey: 'project-key' }))
  })
})
