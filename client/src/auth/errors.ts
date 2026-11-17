import type { AuthError, AuthErrorKind } from './auth-context.ts'

const MESSAGES: Record<AuthErrorKind, string> = {
  'account-not-found': "We couldn't find that account.",
  cancelled: 'Sign-in was cancelled.',
  network: "We couldn't reach the sign-in server. Check your connection and try again.",
  'session-expired': 'Your session expired. Please sign in again.',
  unsupported: "Sign-in isn't available in this browser.",
  unknown: 'Something went wrong while signing in. Please try again.',
}

export function authError(kind: AuthErrorKind): AuthError {
  return { kind, message: MESSAGES[kind] }
}

/** A sign-in failure. Its message is the one to show the user. */
export class AuthFailure extends Error {
  readonly kind: AuthErrorKind

  constructor(kind: AuthErrorKind, options?: ErrorOptions) {
    super(MESSAGES[kind], options)
    this.kind = kind
  }
}
