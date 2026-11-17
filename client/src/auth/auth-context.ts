// The sign-in interface the UI builds on (#19). Everything here is plain
// types and React, so a mock can implement it without the OAuth library.

import { createContext, useContext } from 'react'

/** The signed-in account. */
export type AuthSession = {
  /** Permanent account ID, e.g. `did:plc:…`. Store this, never the handle. */
  did: string
  /** Current handle, e.g. `alice.bsky.social`; `handle.invalid` if it can't be verified. */
  handle: string
}

export type AuthErrorKind =
  | 'account-not-found'
  | 'cancelled'
  | 'network'
  | 'session-expired'
  | 'unsupported'
  | 'unknown'

/** Why sign-in failed or ended, with a message that can be shown as is. */
export type AuthError = { kind: AuthErrorKind; message: string }

export type AuthState =
  /** Restoring the last session, or finishing a sign-in. */
  | { status: 'loading' }
  | { status: 'signed-out'; error?: AuthError }
  /** Leaving for the user's sign-in page. */
  | { status: 'redirecting' }
  | { status: 'signed-in'; session: AuthSession }

export type Auth = AuthState & {
  /**
   * Sends the user to their account's sign-in page, which redirects back to
   * the app when they're done. Accepts a handle, with or without `@`. If the
   * account can't be found or reached, status returns to `signed-out` with an
   * error.
   */
  signIn: (handle: string) => Promise<void>
  /** Ends the session on the server and in this browser. */
  signOut: () => Promise<void>
}

export const AuthContext = createContext<Auth | null>(null)

export function useAuth(): Auth {
  const auth = useContext(AuthContext)
  if (!auth) throw new Error('useAuth() must be used inside <AuthProvider>')
  return auth
}
