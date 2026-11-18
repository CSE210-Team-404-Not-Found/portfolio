import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { XrpcResponseError } from '@atproto/lex'
import { ProfileEditor } from './ProfileEditor.tsx'

const { client, restoreSession } = vi.hoisted(() => ({
  client: {
    get: vi.fn(),
    put: vi.fn(),
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
      constructor(method: string, response: Response, payload?: { body?: { error?: string } }) {
        super(method)
        this.error = payload?.body?.error ?? method
        this.status = response.status
      }
    },
  }
})

vi.mock('../auth/oauth-client.ts', () => ({ restoreOAuthSession: restoreSession }))

describe('ProfileEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    restoreSession.mockResolvedValue({ did: 'did:example:alice' })
    client.get.mockResolvedValue({ value: { fullName: 'Alice Example', jobTitle: 'Engineer', description: 'Hello' } })
    client.put.mockResolvedValue(undefined)
    client.uploadBlob.mockResolvedValue({ body: { blob: { ref: 'uploaded-avatar' } } })
    client.getBlob.mockResolvedValue({ body: new Uint8Array([1, 2, 3]) })
    vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:profile'), revokeObjectURL: vi.fn() })
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('loads, updates, and saves profile fields and an avatar', async () => {
    render(<ProfileEditor did="did:example:alice" />)
    expect(await screen.findByDisplayValue('Alice Example')).toBeTruthy()
    expect(screen.getByDisplayValue('Engineer')).toBeTruthy()
    expect(screen.getByDisplayValue('Hello')).toBeTruthy()

    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: '  Alice A.  ' } })
    fireEvent.change(screen.getByLabelText('Job title'), { target: { value: 'Designer' } })
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Updated bio' } })
    const avatar = new File(['image'], 'avatar.png', { type: 'image/png' })
    fireEvent.change(screen.getByLabelText('Profile picture'), { target: { files: [avatar] } })
    fireEvent.click(screen.getByRole('button', { name: 'Save profile' }))

    await waitFor(() => expect(client.put).toHaveBeenCalled())
    expect(client.uploadBlob).toHaveBeenCalledWith(avatar, { encoding: 'image/png' })
    expect(client.put.mock.calls[0][1]).toMatchObject({
      fullName: 'Alice A.', jobTitle: 'Designer', description: 'Updated bio',
      avatar: { ref: 'uploaded-avatar' },
    })
    expect((await screen.findByRole('status')).textContent).toContain('Profile saved.')
  })

  it('shows an empty editable form when no profile record exists', async () => {
    client.get.mockRejectedValueOnce(new XrpcResponseError(
      'com.atproto.repo.getRecord' as never,
      { status: 400 } as Response,
      { encoding: 'application/json', body: { error: 'RecordNotFound' } } as never,
    ))
    render(<ProfileEditor did="did:example:alice" />)
    expect((await screen.findByLabelText('Full name') as HTMLInputElement).value).toBe('')
    expect((screen.getByRole('button', { name: 'Save profile' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('rejects an unsupported avatar and reports save permission errors', async () => {
    render(<ProfileEditor did="did:example:alice" />)
    await screen.findByDisplayValue('Alice Example')
    fireEvent.change(screen.getByLabelText('Profile picture'), {
      target: { files: [new File(['file'], 'bad.svg', { type: 'image/svg+xml' })] },
    })
    expect(screen.getByRole('alert').textContent).toContain('Choose a JPEG, PNG, or WebP image.')
    client.put.mockRejectedValueOnce(new Error('forbidden'))
    fireEvent.click(screen.getByRole('button', { name: 'Save profile' }))
    expect((await screen.findByRole('alert')).textContent).toContain('Could not save your profile.')
  })
})
