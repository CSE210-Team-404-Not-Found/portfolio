import type { MockProject } from '../../profile/mock-data.ts'
import { ProjectCard } from './ProjectCard.tsx'

// grid of project cards, 2 columns on bigger screens and 1 on phones
export function SelectedWork({ handle, projects }: { handle: string; projects: MockProject[] }) {
  return (
    <section
      id="work"
      aria-labelledby="work-heading"
      className="border-t border-neutral-200 py-12 dark:border-neutral-800"
    >
      <h2 id="work-heading" className="text-2xl font-medium">
        Selected work
      </h2>

      {projects.length === 0 ? (
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">No projects yet.</p>
      ) : (
        <ul className="mt-6 grid gap-x-6 gap-y-10 sm:grid-cols-2">
          {projects.map((project, i) => (
            <li key={project.rkey}>
              <ProjectCard handle={handle} project={project} index={i} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
