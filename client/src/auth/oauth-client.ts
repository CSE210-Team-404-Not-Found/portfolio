// The app's AT Protocol OAuth client, from @atproto/oauth-client-browser.
// It keeps sessions (tokens and DPoP keys) in this browser's IndexedDB and
// refreshes tokens on its own.
//
// AuthProvider loads this module with import(), since the library is most of
// the app's JavaScript. initOAuth() and signIn() reject with an AuthFailure
// that says what to tell the user.

import {
  BrowserOAuthClient,
  buildAtprotoLoopbackClientMetadata,
  FetchRequestError,
  OAuthCallbackError,
  oauthClientMetadataSchema,
  TokenInvalidError,
  TokenRefreshError,
  TokenRevokedError,
  type OAuthSession,
} from '@atproto/oauth-client-browser'
import type { AuthError, AuthErrorKind, AuthSession } from './auth-context.ts'
import { buildClientMetadata, OAUTH_SCOPE } from './client-metadata.ts'
import { AuthFailure, authError } from './errors.ts'

/**
 * Turns the handle the user types into their DID. Browsers can't make the DNS
 * queries this needs, so a server does it. bsky.social resolves any handle,
 * including custom domains and accounts hosted elsewhere, but sees the user's
 * IP address and the handle they typed.
 */
const HANDLE_RESOLVER = 'https://bsky.social'

/** The atproto stand-in for a handle that doesn't match its account. */
const INVALID_HANDLE = 'handle.invalid'

type SessionDeletedListener = (did: string, error: AuthError | undefined) => void
const sessionDeletedListeners = new Set<SessionDeletedListener>()

let client: BrowserOAuthClient | undefined
let initialized: Promise<AuthSession | undefined> | undefined

function getClient(): BrowserOAuthClient {
  client ??= new BrowserOAuthClient({
    clientMetadata: clientMetadata(),
    handleResolver: HANDLE_RESOLVER,
    onSessionDeleted: (did, cause) => {
      // A failed refresh deserves a message; signing out doesn't. Sign-outs
      // from another tab arrive with a copy of `cause` that is no longer an
      // instance of these classes, so they show nothing either.
      const error =
        cause instanceof TokenRefreshError || cause instanceof TokenInvalidError
          ? authError('session-expired')
          : undefined
      for (const listener of sessionDeletedListeners) listener(did, error)
    },
  })
  return client
}

function clientMetadata() {
  const appUrl: string | undefined = import.meta.env.VITE_APP_URL
  if (appUrl) {
    // Deployed: the metadata published at <appUrl>client-metadata.json.
    return oauthClientMetadataSchema.parse(buildClientMetadata(appUrl))
  }
  // Local development: a loopback client, which sign-in servers accept
  // without fetching metadata. It only works on 127.0.0.1 or [::1], not
  // localhost, and its sessions last about a day.
  return buildAtprotoLoopbackClientMetadata({
    scope: OAUTH_SCOPE,
    redirect_uris: [new URL(import.meta.env.BASE_URL, window.location.origin).href],
  })
}

/**
 * Restores the last session, or finishes a sign-in when the page is loaded
 * from the sign-in redirect. Resolves to undefined when nobody is signed in.
 *
 * The library requires this to run once per page load, since it consumes the
 * redirect's URL parameters. React's StrictMode runs effects twice, so every
 * caller shares the first call's promise.
 */
export function initOAuth(): Promise<AuthSession | undefined> {
  initialized ??= init().catch((err: unknown) => {
    throw toAuthFailure(err)
  })
  return initialized
}

async function init(): Promise<AuthSession | undefined> {
  if (!import.meta.env.VITE_APP_URL && window.location.hostname === 'localhost') {
    // The loopback client can't be built on localhost. Reload on 127.0.0.1,
    // the origin its sign-in redirect comes back to.
    window.location.hostname = '127.0.0.1'
    return new Promise<never>(() => {})
  }
  const result = await getClient().init()
  return result && describeSession(result.session)
}

/**
 * Sends the browser to the account's sign-in page, which redirects back to
 * the app. The promise only settles if that fails.
 */
export async function signIn(handle: string): Promise<never> {
  const oauth = getClient()
  // Look the account up first, to tell "no such account" apart from other
  // failures. The client caches the result, so authorize() doesn't repeat it.
  await oauth.identityResolver.resolve(handle).catch((err: unknown) => {
    throw isNetworkError(err)
      ? toAuthFailure(err)
      : new AuthFailure('account-not-found', { cause: err })
  })
  const url = await oauth.authorize(handle).catch((err: unknown) => {
    throw toAuthFailure(err)
  })
  window.location.assign(url)
  // The page is unloading.
  return new Promise<never>(() => {})
}

/** Revokes the session's tokens and deletes it from this browser. */
export async function signOut(did: string): Promise<void> {
  await getClient().revoke(did)
}

/**
 * Calls `listener` whenever a stored session is deleted: on sign-out, here or
 * in another tab, or when its tokens can no longer be refreshed. Returns a
 * function that stops listening.
 */
export function onSessionDeleted(listener: SessionDeletedListener): () => void {
  sessionDeletedListeners.add(listener)
  return () => {
    sessionDeletedListeners.delete(listener)
  }
}

/** The session's DID and its current handle, checked against the DID document. */
async function describeSession(session: OAuthSession): Promise<AuthSession> {
  try {
    const { handle } = await getClient().identityResolver.resolve(session.did)
    return { did: session.did, handle }
  } catch (err) {
    console.warn(`Couldn't resolve the handle of ${session.did}`, err)
    return { did: session.did, handle: INVALID_HANDLE }
  }
}

function toAuthFailure(err: unknown): AuthFailure {
  return err instanceof AuthFailure ? err : new AuthFailure(classify(err), { cause: err })
}

function classify(err: unknown): AuthErrorKind {
  // The user chose Cancel on their sign-in page, which redirects back with
  // error=access_denied.
  if (err instanceof OAuthCallbackError && err.params.get('error') === 'access_denied') {
    return 'cancelled'
  }
  if (
    err instanceof TokenRefreshError ||
    err instanceof TokenRevokedError ||
    err instanceof TokenInvalidError
  ) {
    return 'session-expired'
  }
  return isNetworkError(err) ? 'network' : 'unknown'
}

/** True if `err`, or an error it wraps, is a request that got no response. */
function isNetworkError(err: unknown): boolean {
  if (!navigator.onLine) return true
  for (let e = err, depth = 0; e instanceof Error && depth < 10; e = e.cause, depth++) {
    if (e instanceof FetchRequestError) return true
    // fetch() rejects with a TypeError: "Failed to fetch" (Chrome),
    // "NetworkError when attempting to fetch resource." (Firefox) or
    // "Load failed" (Safari).
    if (e instanceof TypeError && /fetch|network|load failed/i.test(e.message)) return true
  }
  return false
}
