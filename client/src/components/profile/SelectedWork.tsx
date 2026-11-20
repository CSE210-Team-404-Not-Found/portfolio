import type { Project } from '../../profile/useProjects.ts'
import { ProjectCard } from './ProjectCard.tsx'

type SelectedWorkProps = {
  handle: string
  // undefined while they're still loading
  projects?: Project[]
  // their pds couldn't be reached
  failed?: boolean
}

// grid of project cards, 2 columns on bigger screens and 1 on phones
export function SelectedWork({ handle, projects, failed }: SelectedWorkProps) {
  return (
    <section
      id="work"
      aria-labelledby="work-heading"
      className="border-t border-neutral-200 py-12 dark:border-neutral-800"
    >
      <h2 id="work-heading" className="text-2xl font-medium">
        Selected work
      </h2>
      <ProjectList handle={handle} projects={projects} failed={failed} />
    </section>
  )
}

function ProjectList({ handle, projects, failed }: SelectedWorkProps) {
  // the rest of the profile still shows even if the projects don't load
  if (failed) {
    return <p className="mt-2 text-neutral-600 dark:text-neutral-400">Couldn't load projects.</p>
  }
  if (!projects) {
    return (
      <p role="status" className="mt-2 text-neutral-600 dark:text-neutral-400">
        Loading projects…
      </p>
    )
  }
  if (projects.length === 0) {
    return <p className="mt-2 text-neutral-600 dark:text-neutral-400">No projects yet.</p>
  }
  return (
    <ul className="mt-6 grid gap-x-6 gap-y-10 sm:grid-cols-2">
      {projects.map((project, i) => (
        <li key={project.rkey}>
          <ProjectCard handle={handle} project={project} index={i} />
        </li>
      ))}
    </ul>
  )
}
