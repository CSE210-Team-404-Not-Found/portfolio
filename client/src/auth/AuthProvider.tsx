import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { type Auth, AuthContext, type AuthError, type AuthState } from './auth-context.ts'
import { AuthFailure, authError } from './errors.ts'

/** Provides `useAuth()` to the app: the signed-in account, signIn and signOut. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' })

  useEffect(() => {
    let active = true
    let unsubscribe = () => {}
    loadOAuth()
      .then(async (oauth) => {
        if (!active) return
        unsubscribe = oauth.onSessionDeleted((did, error) => {
          setState((current) =>
            current.status === 'signed-in' && current.session.did === did
              ? { status: 'signed-out', error }
              : current,
          )
        })
        const session = await oauth.initOAuth()
        if (active) setState(session ? { status: 'signed-in', session } : { status: 'signed-out' })
      })
      .catch((err: unknown) => {
        if (active) setState({ status: 'signed-out', error: toAuthError(err) })
      })
    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    // The Back button on the sign-in page can restore this page from the
    // browser's cache exactly as it was left: still redirecting.
    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return
      setState((current) => (current.status === 'redirecting' ? { status: 'signed-out' } : current))
    }
    window.addEventListener('pageshow', onPageShow)
    return () => window.removeEventListener('pageshow', onPageShow)
  }, [])

  const signIn = useCallback(async (input: string) => {
    setState({ status: 'redirecting' })
    try {
      const oauth = await loadOAuth()
      await oauth.signIn(input.trim().replace(/^@/, ''))
    } catch (err) {
      setState({ status: 'signed-out', error: toAuthError(err) })
    }
  }, [])

  const did = state.status === 'signed-in' ? state.session.did : undefined
  const signOut = useCallback(async () => {
    if (!did) return
    try {
      const oauth = await loadOAuth()
      await oauth.signOut(did)
    } catch (err) {
      // The session is gone from this browser even if the server wasn't told.
      console.warn('Could not revoke the session on the server', err)
    }
    setState({ status: 'signed-out' })
  }, [did])

  const auth = useMemo<Auth>(() => ({ ...state, signIn, signOut }), [state, signIn, signOut])
  return <AuthContext value={auth}>{children}</AuthContext>
}

/**
 * Loads the OAuth client on first use, so the library stays out of the main
 * bundle. Checks first for what it needs, so unsupported browsers (and
 * jsdom in tests) never load it.
 */
function loadOAuth(): Promise<typeof import('./oauth-client.ts')> {
  if (typeof indexedDB === 'undefined' || !globalThis.crypto?.subtle) {
    return Promise.reject(new AuthFailure('unsupported'))
  }
  return import('./oauth-client.ts')
}

function toAuthError(err: unknown): AuthError {
  if (err instanceof AuthFailure && err.kind !== 'unknown') return authError(err.kind)
  console.error('Sign-in failed:', err instanceof AuthFailure ? err.cause : err)
  return authError('unknown')
}
