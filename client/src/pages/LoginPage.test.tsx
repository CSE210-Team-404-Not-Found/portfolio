import { useMemo, useState, type ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createMemoryHistory, RouterProvider } from '@tanstack/react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { type Auth, AuthContext, type AuthState } from '../auth/auth-context.ts'
import { authError } from '../auth/errors.ts'
import { createAppRouter } from '../router.ts'

type SetState = (state: AuthState) => void

type FakeAuthOptions = {
  initial?: AuthState
  /** Plays the part of the real sign-in: moves the fake to whatever state the test needs. */
  signIn?: (handle: string, setState: SetState) => void
  signOut?: () => void
}

// Stands in for AuthProvider, so tests don't load the OAuth library or touch the network.
function FakeAuthProvider({
  initial = { status: 'signed-out' },
  signIn = () => {},
  signOut = () => {},
  children,
}: FakeAuthOptions & { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(initial)
  const auth = useMemo<Auth>(
    () => ({
      ...state,
      signIn: async (handle) => signIn(handle, setState),
      signOut: async () => {
        signOut()
        setState({ status: 'signed-out' })
      },
    }),
    [state, signIn, signOut],
  )
  return <AuthContext value={auth}>{children}</AuthContext>
}

function renderApp(options: FakeAuthOptions = {}, path = '/login') {
  const router = createAppRouter(createMemoryHistory({ initialEntries: [path] }))
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <FakeAuthProvider {...options}>
        <RouterProvider router={router} />
      </FakeAuthProvider>
    </QueryClientProvider>,
  )
  return router
}

async function submitHandle(handle: string) {
  const user = userEvent.setup()
  await user.type(await screen.findByLabelText('Handle'), handle)
  await user.click(screen.getByRole('button', { name: 'Sign in' }))
}

const MAYA = { did: 'did:plc:test', handle: 'maya.bsky.social' }

beforeEach(() => {
  // Profile lookups fail in tests, so the header falls back to a letter.
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response('{}', { status: 404 })),
  )
})

describe('LoginPage', () => {
  it('signs in with a normalized handle and shows it in the header', async () => {
    const signIn = vi.fn((handle: string, setState: SetState) =>
      setState({ status: 'signed-in', session: { did: 'did:plc:test', handle } }),
    )
    const router = renderApp({ signIn })

    await submitHandle('  @Maya.Bsky.Social ')

    expect(signIn).toHaveBeenCalledWith('maya.bsky.social', expect.any(Function))
    expect(await screen.findByText('@maya.bsky.social')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/')
  })

  it('rejects a handle without a domain before contacting anyone', async () => {
    const signIn = vi.fn()
    renderApp({ signIn })

    await submitHandle('maya')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Enter a full handle, like alice.bsky.social.',
    )
    expect(signIn).not.toHaveBeenCalled()
  })

  it('shows the error from sign-in when the account does not exist', async () => {
    renderApp({
      signIn: (_handle, setState) =>
        setState({ status: 'signed-out', error: authError('account-not-found') }),
    })

    await submitHandle('nobody.bsky.social')

    expect(await screen.findByRole('alert')).toHaveTextContent("We couldn't find that account.")
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled()
  })

  it('replaces a format error with the result of the next attempt', async () => {
    renderApp({
      signIn: (_handle, setState) =>
        setState({ status: 'signed-out', error: authError('network') }),
    })

    await submitHandle('maya')
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Handle'), '.bsky.social')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByRole('alert')).toHaveTextContent("We couldn't reach the sign-in server.")
  })

  it('shows a message when the user cancelled sign-in on their account page', async () => {
    renderApp({ initial: { status: 'signed-out', error: authError('cancelled') } })

    expect(await screen.findByRole('alert')).toHaveTextContent('Sign-in was cancelled.')
  })

  it('shows a loading state while redirecting', async () => {
    renderApp({ signIn: (_handle, setState) => setState({ status: 'redirecting' }) })

    await submitHandle('maya.bsky.social')

    const button = await screen.findByRole('button', { name: 'Redirecting to sign in…' })
    expect(button).toBeDisabled()
    expect(screen.getByLabelText('Handle')).toBeDisabled()
  })

  it('links to account creation for people without a handle', async () => {
    renderApp()

    expect(await screen.findByRole('link', { name: 'Create one on Bluesky' })).toHaveAttribute(
      'href',
      'https://bsky.app',
    )
  })

  it('redirects to the home page when already signed in', async () => {
    const router = renderApp({ initial: { status: 'signed-in', session: MAYA } })

    expect(await screen.findByText('@maya.bsky.social')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/')
  })
})

describe('AuthErrorBanner', () => {
  it('shows a cancelled sign-in on the home page, where sign-in returns to', async () => {
    renderApp({ initial: { status: 'signed-out', error: authError('cancelled') } }, '/')

    expect(await screen.findByRole('alert')).toHaveTextContent('Sign-in was cancelled.')
  })

  it('can be dismissed', async () => {
    renderApp({ initial: { status: 'signed-out', error: authError('session-expired') } }, '/')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Dismiss' }))

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('stays hidden on the login page, which shows the error itself', async () => {
    renderApp({ initial: { status: 'signed-out', error: authError('cancelled') } })

    expect(await screen.findAllByRole('alert')).toHaveLength(1)
  })
})

describe('Header', () => {
  it('signs out and shows the sign-in link again', async () => {
    const signOut = vi.fn()
    renderApp({ initial: { status: 'signed-in', session: MAYA }, signOut }, '/')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Sign out' }))

    expect(signOut).toHaveBeenCalled()
    expect(await screen.findByRole('link', { name: 'Sign in' })).toBeInTheDocument()
  })

  it('says it is signing you in while finishing the sign-in redirect', async () => {
    window.history.replaceState(null, '', '/#state=abc&iss=https%3A%2F%2Fbsky.social&code=xyz')
    try {
      renderApp({ initial: { status: 'loading' } }, '/')

      expect(await screen.findByRole('status')).toHaveTextContent('Signing you in…')
    } finally {
      window.history.replaceState(null, '', '/')
    }
  })

  it('stays quiet while restoring a session on a normal page load', async () => {
    renderApp({ initial: { status: 'loading' } }, '/')

    expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('shows a fallback instead of an unconfirmed handle', async () => {
    renderApp(
      { initial: { status: 'signed-in', session: { did: 'did:plc:test', handle: 'handle.invalid' } } },
      '/',
    )

    expect(await screen.findByText('Your account')).toBeInTheDocument()
    expect(screen.queryByText('@handle.invalid')).not.toBeInTheDocument()
  })
})
