import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
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
    restoreSession.mockResolvedValue({ did: 'did:example:alice', getTokenInfo: async () => ({ aud: 'https://pds.example' }) })
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
      body: cid === 'thumbnail-cid' ? new Uint8Array([1, 2]) : new TextEncoder().encode(cid === 'json-cid' ? JSON.stringify({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'My contribution', marks: [{ type: 'bold' }] }] }] }) : '<p>stale HTML must not be used</p>'),
    }))
    const NativeURL = URL
    vi.stubGlobal('URL', class extends NativeURL {
      static createObjectURL = vi.fn(() => 'blob:project')
      static revokeObjectURL = vi.fn()
    })
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
    expect(await screen.findByText('My contribution')).toBeTruthy()
    expect(screen.getByText('My contribution').tagName).toBe('STRONG')
    expect(screen.queryByText('stale HTML must not be used')).toBeNull()
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: '  Updated site  ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Update project' }))

    await waitFor(() => expect(client.put).toHaveBeenCalled())
    expect(client.put.mock.calls[0][1]).toMatchObject({ title: 'Updated site', summary: 'A personal site', thumbnail: project.thumbnail })
    expect(client.put.mock.calls[0][2]).toMatchObject({ rkey: 'project-key', validateRequest: true })
    expect(await screen.findByRole('status')).toBeTruthy()
    const htmlUpload = client.uploadBlob.mock.calls.find((call) => call[1].encoding === 'text/html')!
    expect(new TextDecoder().decode(await htmlUpload[0].arrayBuffer())).toBe('<p><strong>My contribution</strong></p>')
    expect(screen.getByRole('textbox', { name: 'Description' }).textContent).toBe('')
  })

  it('creates a project and uploads its thumbnail and Tiptap blobs', async () => {
    client.listAll.mockImplementation(async function* () {})
    render(<ProjectEditor did="did:example:alice" />)
    await screen.findByText('No projects yet.')
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'New project' } })
    fireEvent.change(screen.getByLabelText('Summary'), { target: { value: 'New summary' } })
    // Real contenteditable input: ProseMirror observes and parses the DOM change.
    await act(async () => {
      const description = screen.getByRole('textbox', { name: 'Description' })
      description.innerHTML = '<p>My <strong>new</strong> project</p>'
      fireEvent.input(description)
    })
    fireEvent.change(screen.getByLabelText(/Thumbnail/), {
      target: { files: [new File(['image'], 'thumb.png', { type: 'image/png' })] },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create project' }))

    await waitFor(() => expect(client.create).toHaveBeenCalled())
    expect(client.uploadBlob).toHaveBeenCalledTimes(3)
    const jsonUpload = client.uploadBlob.mock.calls.find((call) => call[1].encoding === 'application/json')!
    const htmlUpload = client.uploadBlob.mock.calls.find((call) => call[1].encoding === 'text/html')!
    const json = JSON.parse(new TextDecoder().decode(await jsonUpload[0].arrayBuffer()))
    expect(json.content[0].content).toContainEqual({ type: 'text', marks: [{ type: 'bold' }], text: 'new' })
    expect(new TextDecoder().decode(await htmlUpload[0].arrayBuffer())).toBe('<p>My <strong>new</strong> project</p>')
    expect(client.create.mock.calls[0][1]).toMatchObject({
      title: 'New project',
      summary: 'New summary',
      thumbnail: { ref: 'uploaded-image/png' },
      tiptapJson: { ref: 'uploaded-application/json' },
      tiptapHtml: { ref: 'uploaded-text/html' },
    })
  })

  it('rejects unsafe links and oversized descriptions before uploading', async () => {
    client.listAll.mockImplementation(async function* () {})
    render(<ProjectEditor did="did:example:alice" />)
    await screen.findByText('No projects yet.')
    fireEvent.click(screen.getByRole('button', { name: 'Add link' }))
    fireEvent.change(screen.getByLabelText('Link URL'), { target: { value: 'javascript:alert(1)' } })
    fireEvent.click(screen.getByRole('button', { name: 'Apply link' }))
    expect(screen.getByRole('alert').textContent).toContain('Use an http://, https://, or mailto: link.')
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Project' } })
    fireEvent.change(screen.getByLabelText('Summary'), { target: { value: 'Summary' } })
    await act(async () => {
      const description = screen.getByRole('textbox', { name: 'Description' })
      description.innerHTML = `<p>${'a'.repeat(20_001)}</p>`
      fireEvent.input(description)
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create project' }))
    expect((await screen.findByRole('alert')).textContent).toContain('20,000 characters')
    expect(client.uploadBlob).not.toHaveBeenCalled()
    expect(client.create).not.toHaveBeenCalled()
  })

  it('imports a document with media and generates a project preview without saving', async () => {
    client.listAll.mockImplementation(async function* () {})
    render(<ProjectEditor did="did:example:alice" authorName="@alice.test" />)
    await screen.findByText('No projects yet.')
    const document = { type: 'doc', content: [
      { type: 'paragraph', content: [{ type: 'text', text: 'My imported project' }] },
      { type: 'image', attrs: { src: 'data:image/png;base64,aGVsbG8=', alt: 'Demo image' } },
      { type: 'audioRecording', attrs: { src: 'data:audio/wav;base64,aGVsbG8=' } },
    ] }
    const file = new File([JSON.stringify(document)], 'portfolio.json', { type: 'application/json' })
    Object.defineProperty(file, 'text', { value: async () => JSON.stringify(document) })
    fireEvent.change(screen.getByLabelText('Import document'), { target: { files: [file] } })
    expect(await screen.findByText('My imported project')).toBeTruthy()
    expect(screen.getByAltText('Demo image')).toBeTruthy()
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Preview title' } })
    fireEvent.click(screen.getByRole('button', { name: 'Preview project' }))
    expect(screen.getByRole('article', { name: 'Project preview' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Preview title', level: 1 })).toBeTruthy()
    expect(screen.getByText('@alice.test')).toBeTruthy()
    expect(client.create).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Back to editor' }))
    expect(screen.getByRole('textbox', { name: 'Description' }).textContent).toContain('My imported project')
    fireEvent.change(screen.getByLabelText('Summary'), { target: { value: 'A media project' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create project' }))
    await waitFor(() => expect(client.create).toHaveBeenCalled())
    expect(client.create.mock.calls[0][1].media).toHaveLength(2)
    expect(client.create.mock.calls[0][1].descriptionFormat).toBe('tiptap-media-v1')
    const jsonUpload = client.uploadBlob.mock.calls.find(call => call[1].encoding === 'application/json')!
    const stored = new TextDecoder().decode(await jsonUpload[0].arrayBuffer())
    expect(stored).not.toContain('data:')
    expect(stored).toContain('https://pds.example/')
  })

  it('keeps the current document when an imported JSON file is invalid', async () => {
    client.listAll.mockImplementation(async function* () {})
    render(<ProjectEditor did="did:example:alice" />)
    await screen.findByText('No projects yet.')
    const file = new File(['{}'], 'broken.json', { type: 'application/json' })
    Object.defineProperty(file, 'text', { value: async () => '{"type":"doc","content":[{"type":"unknown"}]}' })
    fireEvent.change(screen.getByLabelText('Import document'), { target: { files: [file] } })
    expect((await screen.findByRole('alert')).textContent).toContain('Could not import')
    expect(client.create).not.toHaveBeenCalled()
  })

  it('handles microphone permission denial without inserting audio', async () => {
    const getUserMedia = vi.fn().mockRejectedValue(new DOMException('Denied', 'NotAllowedError'))
    vi.stubGlobal('navigator', { platform: navigator.platform, userAgent: navigator.userAgent, vendor: navigator.vendor, maxTouchPoints: 0, mediaDevices: { getUserMedia } })
    vi.stubGlobal('MediaRecorder', class {})
    client.listAll.mockImplementation(async function* () {})
    render(<ProjectEditor did="did:example:alice" />)
    await screen.findByText('No projects yet.')
    fireEvent.click(screen.getByRole('button', { name: 'Record audio' }))
    expect((await screen.findByRole('alert')).textContent).toContain('Microphone access was denied')
    expect(client.uploadBlob).not.toHaveBeenCalled()
  })

  it('stops the microphone and inserts recorded audio only when recording finishes', async () => {
    const stopTrack = vi.fn()
    const getUserMedia = vi.fn().mockResolvedValue({ getTracks: () => [{ stop: stopTrack }] })
    vi.stubGlobal('navigator', { platform: navigator.platform, userAgent: navigator.userAgent, vendor: navigator.vendor, maxTouchPoints: 0, mediaDevices: { getUserMedia } })
    vi.stubGlobal('MediaRecorder', class {
      state = 'inactive'
      mimeType = 'audio/webm'
      ondataavailable: ((event: { data: Blob }) => void) | null = null
      onstop: (() => Promise<void>) | null = null
      onerror: (() => void) | null = null
      start() { this.state = 'recording' }
      stop() {
        this.state = 'inactive'
        this.ondataavailable?.({ data: new Blob(['audio'], { type: 'audio/webm' }) })
        void this.onstop?.()
      }
    })
    client.listAll.mockImplementation(async function* () {})
    const { container } = render(<ProjectEditor did="did:example:alice" />)
    await screen.findByText('No projects yet.')
    fireEvent.click(screen.getByRole('button', { name: 'Record audio' }))
    const stopButton = await screen.findByRole('button', { name: 'Stop recording' })
    expect(container.querySelector('audio')).toBeNull()
    expect((screen.getByRole('button', { name: 'Create project' }) as HTMLButtonElement).disabled).toBe(true)
    fireEvent.click(stopButton)
    await waitFor(() => expect(container.querySelector('audio')?.getAttribute('src')).toContain('data:audio/webm;base64,'))
    expect(stopTrack).toHaveBeenCalled()
    expect(client.uploadBlob).not.toHaveBeenCalled()
  })

  it('opens compact link controls and inserts linked text without submitting the project', async () => {
    client.listAll.mockImplementation(async function* () {})
    render(<ProjectEditor did="did:example:alice" />)
    await screen.findByText('No projects yet.')
    expect(screen.queryByLabelText('Link URL')).toBeNull()
    expect(screen.queryByLabelText('Video URL')).toBeNull()
    expect(screen.getByRole('button', { name: 'Bold' }).querySelector('svg')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Add link' }))
    expect(screen.getByRole('dialog', { name: 'Add link' })).toBeTruthy()
    fireEvent.change(screen.getByLabelText('Text'), { target: { value: 'My repository' } })
    fireEvent.change(screen.getByLabelText('Link URL'), { target: { value: 'https://github.com/example/project' } })
    fireEvent.submit(screen.getByRole('button', { name: 'Apply link' }).closest('form')!)
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByRole('link', { name: 'My repository' }).getAttribute('href')).toBe('https://github.com/example/project')
    expect(client.create).not.toHaveBeenCalled()
  })

  it('opens Video URL only on request and inserts video without submitting the project', async () => {
    client.listAll.mockImplementation(async function* () {})
    const { container } = render(<ProjectEditor did="did:example:alice" />)
    await screen.findByText('No projects yet.')
    fireEvent.click(screen.getByRole('button', { name: 'Add video' }))
    const dialog = screen.getByRole('dialog', { name: 'Add video' })
    expect(screen.getByLabelText('Video URL')).toBeTruthy()
    fireEvent.change(screen.getByLabelText('Video URL'), { target: { value: 'https://example.com/video' } })
    fireEvent.submit(dialog.querySelector('form')!)
    expect(screen.getByRole('alert').textContent).toContain('YouTube')
    fireEvent.change(screen.getByLabelText('Video URL'), { target: { value: 'https://youtu.be/abcdefghijk' } })
    fireEvent.submit(dialog.querySelector('form')!)
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(container.querySelector('iframe')?.getAttribute('src')).toContain('youtube-nocookie.com/embed/abcdefghijk')
    expect(client.create).not.toHaveBeenCalled()
  })

  it('cancels link and video dialogs without inserting content', async () => {
    client.listAll.mockImplementation(async function* () {})
    const { container } = render(<ProjectEditor did="did:example:alice" />)
    await screen.findByText('No projects yet.')
    fireEvent.click(screen.getByRole('button', { name: 'Add link' }))
    fireEvent.change(screen.getByLabelText('Text'), { target: { value: 'Do not insert' } })
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(container.querySelector('.project-description')?.textContent).toBe('')
    fireEvent.click(screen.getByRole('button', { name: 'Add video' }))
    fireEvent.click(screen.getByRole('button', { name: 'Close dialog' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(container.querySelector('iframe')).toBeNull()
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
