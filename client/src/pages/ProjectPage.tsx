import { Link, useParams } from '@tanstack/react-router'
import { ProfileNotFoundError, useProfile } from '../profile/useProfile.ts'
import { useProject } from '../profile/useProjects.ts'

// placeholder so the project cards on the profile page have somewhere to go
// the actual project page is a different issue
export function ProjectPage() {
  const { handle, pid } = useParams({ from: '/profile/$handle/project/$pid' })
  // the url has their handle but the record is looked up by did
  const profile = useProfile(handle)
  const project = useProject(profile.data?.did, pid)

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <Link
        to="/profile/$handle"
        params={{ handle }}
        className="text-sm underline-offset-4 hover:underline"
      >
        ← Back to @{handle}
      </Link>
      <ProjectBody profileError={profile.error} project={project} />
    </main>
  )
}

function ProjectBody({
  profileError,
  project,
}: {
  profileError: Error | null
  project: ReturnType<typeof useProject>
}) {
  // no account or no project with that rkey both end up here
  if (profileError instanceof ProfileNotFoundError || project.data === null) {
    return <h1 className="mt-4 text-3xl font-semibold">Project not found</h1>
  }
  if (profileError || project.isError) {
    return <h1 className="mt-4 text-3xl font-semibold">Couldn't load this project</h1>
  }
  if (!project.data) {
    return (
      <p role="status" className="mt-4 text-neutral-600 dark:text-neutral-400">
        Loading project…
      </p>
    )
  }
  return (
    <>
      <h1 className="mt-4 text-3xl font-semibold">{project.data.title}</h1>
      <p className="mt-2 text-neutral-600 dark:text-neutral-400">
        The full project page is coming soon.
      </p>
    </>
  )
}
