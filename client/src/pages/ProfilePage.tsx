import { useParams } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { useProfile } from '../profile/useProfile.ts'

// /profile/:handle
// anyone can see this page, you don't have to be signed in
export function ProfilePage() {
  const { handle } = useParams({ from: '/profile/$handle' })
  const { data: profile, isPending } = useProfile(handle)

  if (isPending) {
    return (
      <PageShell>
        <p role="status" className="text-neutral-600 dark:text-neutral-400">
          Loading profile…
        </p>
      </PageShell>
    )
  }

  // TODO not found and bluesky being down should get their own messages
  if (!profile) {
    return (
      <PageShell>
        <p>Couldn't load this profile.</p>
      </PageShell>
    )
  }

  // bluesky gives back the handle the way it's actually spelled
  const shownHandle = profile.handle ?? handle
  // not everyone sets a display name so fall back to the handle
  const name = profile.displayName || shownHandle

  return (
    <PageShell>
      <h1 className="text-3xl font-semibold">{name}</h1>
      <p className="text-neutral-600 dark:text-neutral-400">@{shownHandle}</p>
    </PageShell>
  )
}

function PageShell({ children }: { children: ReactNode }) {
  return <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">{children}</main>
}
