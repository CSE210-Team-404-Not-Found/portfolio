import { Link, useParams } from '@tanstack/react-router'
import { getMockProject } from '../profile/mock-data.ts'

// placeholder so the project cards on the profile page have somewhere to go
// the actual project page is a different issue
export function ProjectPage() {
  const { handle, pid } = useParams({ from: '/profile/$handle/project/$pid' })
  const project = getMockProject(pid)

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <Link
        to="/profile/$handle"
        params={{ handle }}
        className="text-sm underline-offset-4 hover:underline"
      >
        ← Back to @{handle}
      </Link>

      {project ? (
        <>
          <h1 className="mt-4 text-3xl font-semibold">{project.title}</h1>
          <p className="mt-2 text-neutral-600 dark:text-neutral-400">
            The full project page is coming soon.
          </p>
        </>
      ) : (
        <h1 className="mt-4 text-3xl font-semibold">Project not found</h1>
      )}
    </main>
  )
}
