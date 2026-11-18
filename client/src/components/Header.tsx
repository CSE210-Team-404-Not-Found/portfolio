import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useAuth } from '../auth/auth-context.ts'
import { useProfile } from '../profile/useProfile.ts'

/** The handle atproto reports when it can't confirm an account's handle. */
const INVALID_HANDLE = 'handle.invalid'

/**
 * True when the page was loaded by the sign-in redirect, which puts its result
 * in the URL (`#state=…&code=…`, or `error=…` if cancelled). Read once on mount:
 * the OAuth client clears the URL while it finishes signing in.
 */
function isReturningFromSignIn(): boolean {
  const query = window.location.hash.slice(1) || window.location.search.slice(1)
  const params = new URLSearchParams(query)
  return params.has('state') && (params.has('code') || params.has('error'))
}

export function Header() {
  const auth = useAuth()
  const [returningFromSignIn] = useState(isReturningFromSignIn)

  return (
    <header className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
      <Link to="/" className="font-semibold">
        OpenShowcase
      </Link>
      {auth.status === 'loading' && returningFromSignIn && (
        <span
          role="status"
          className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400"
        >
          <span
            aria-hidden="true"
            className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900 dark:border-neutral-700 dark:border-t-neutral-100"
          />
          Signing you in…
        </span>
      )}
      {auth.status === 'signed-in' && (
        <SignedInUser did={auth.session.did} handle={auth.session.handle} />
      )}
      {auth.status === 'signed-out' && (
        <Link to="/login" className="text-sm font-medium underline-offset-4 hover:underline">
          Sign in
        </Link>
      )}
    </header>
  )
}

function SignedInUser({ did, handle }: { did: string; handle: string }) {
  const { signOut } = useAuth()
  const { data: profile } = useProfile(did)
  // The handle can be unconfirmed (e.g. its server is briefly down); fall back to the display name.
  const label = handle === INVALID_HANDLE ? (profile?.displayName ?? 'Your account') : `@${handle}`

  return (
    <div className="flex items-center gap-3">
      <Avatar src={profile?.avatar} label={label} />
      <span className="text-sm">{label}</span>
      <button
        type="button"
        onClick={() => void signOut()}
        className="rounded-full border border-neutral-300 px-3 py-1 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
      >
        Sign out
      </button>
    </div>
  )
}

// Falls back to the label's first letter when the profile has no avatar or can't be loaded.
function Avatar({ src, label }: { src?: string; label: string }) {
  if (src) {
    return <img src={src} alt="" className="h-8 w-8 rounded-full object-cover" />
  }
  return (
    <span
      aria-hidden="true"
      className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-200 text-sm font-medium dark:bg-neutral-700"
    >
      {label.replace(/^@/, '')[0].toUpperCase()}
    </span>
  )
}
