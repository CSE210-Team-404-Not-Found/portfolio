import { useParams } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { SelectedWork } from '../components/profile/SelectedWork.tsx'
import { getMockProjects } from '../profile/mock-data.ts'
import { ProfileNotFoundError, useProfile } from '../profile/useProfile.ts'

// /profile/:handle
// anyone can see this page, you don't have to be signed in
export function ProfilePage() {
  const { handle } = useParams({ from: '/profile/$handle' })
  const { data: profile, error, isPending, refetch } = useProfile(handle)

  if (isPending) {
    return (
      <PageShell>
        <p role="status" className="py-12 text-neutral-600 dark:text-neutral-400">
          Loading profile…
        </p>
      </PageShell>
    )
  }

  // handle doesn't belong to any account
  if (error instanceof ProfileNotFoundError) {
    return (
      <PageShell>
        <div className="py-12">
          <h1 className="text-2xl font-semibold">Profile not found</h1>
          <p className="mt-2 text-neutral-600 dark:text-neutral-400">
            There's no account with the handle @{handle}. Check the spelling and try again.
          </p>
        </div>
      </PageShell>
    )
  }

  // anything else like bluesky's server being down
  if (error) {
    return (
      <PageShell>
        <div className="py-12">
          <h1 className="text-2xl font-semibold">Couldn't load this profile</h1>
          <p className="mt-2 text-neutral-600 dark:text-neutral-400">
            Something went wrong reaching the profile server.
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-4 rounded-lg border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            Try again
          </button>
        </div>
      </PageShell>
    )
  }

  // bluesky gives back the handle the way it's actually spelled
  const shownHandle = profile.handle ?? handle
  // not everyone sets a display name so fall back to the handle
  const name = profile.displayName || shownHandle

  // still mock data until #18 is done
  const projects = getMockProjects()

  return (
    <PageShell>
      <div className="py-12">
        <h1 className="text-3xl font-semibold">{name}</h1>
        <p className="text-neutral-600 dark:text-neutral-400">@{shownHandle}</p>
      </div>
      <SelectedWork handle={shownHandle} projects={projects} />
    </PageShell>
  )
}

function PageShell({ children }: { children: ReactNode }) {
  return <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">{children}</main>
}
