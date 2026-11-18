import { useState } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { type AuthError, useAuth } from '../auth/auth-context.ts'

/**
 * Shows sign-in errors on pages other than /login. Sign-in always returns to
 * the home page, so a cancelled sign-in or an expired session lands there.
 */
export function AuthErrorBanner() {
  const auth = useAuth()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const [dismissed, setDismissed] = useState<AuthError | null>(null)

  const error = auth.status === 'signed-out' ? auth.error : undefined
  // The login page shows the error next to the form; "unsupported" is shown there too.
  if (!error || error === dismissed || pathname === '/login' || error.kind === 'unsupported') {
    return null
  }

  return (
    <div
      role="alert"
      className="flex items-center justify-between gap-3 border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
    >
      <span>
        {error.message}{' '}
        <Link to="/login" className="font-medium underline underline-offset-4">
          Sign in
        </Link>
      </span>
      <button
        type="button"
        onClick={() => setDismissed(error)}
        aria-label="Dismiss"
        className="rounded px-2 hover:bg-red-100 dark:hover:bg-red-900"
      >
        ×
      </button>
    </div>
  )
}
