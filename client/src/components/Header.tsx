import { Link } from '@tanstack/react-router'
import { useAuth } from '../auth/auth-context.ts'
import { useProfile } from '../profile/useProfile.ts'

/** The handle atproto reports when it can't confirm an account's handle. */
const INVALID_HANDLE = 'handle.invalid'

export function Header() {
  const auth = useAuth()

  return (
    <header className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
      <Link to="/" className="font-semibold">
        OpenShowcase
      </Link>
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
  const label =
    handle === INVALID_HANDLE ? (profile?.displayName ?? 'Your account') : `@${handle}`

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
