import { Link } from '@tanstack/react-router'
import type { Project } from '../../profile/useProjects.ts'

type ProjectCardProps = {
  handle: string
  project: Project
  index: number
}

// one card in "Selected work", clicking it goes to that project's page
export function ProjectCard({ handle, project, index }: ProjectCardProps) {
  // figma numbers the cards 01, 02, 03...
  const number = String(index + 1).padStart(2, '0')

  return (
    <Link
      to="/profile/$handle/project/$pid"
      params={{ handle, pid: project.rkey }}
      className="group block h-full"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-900">
        {/* no thumbnail means it just stays a grey box */}
        {project.thumbnailUrl && (
          <img src={project.thumbnailUrl} alt="" className="h-full w-full object-cover" />
        )}
        <span
          aria-hidden="true"
          className="absolute top-3 left-3 text-xs text-neutral-500 dark:text-neutral-400"
        >
          {number}
        </span>
        <span
          aria-hidden="true"
          className="absolute top-3 right-3 text-neutral-500 dark:text-neutral-400"
        >
          ↗
        </span>
      </div>

      <h3 className="mt-3 font-medium group-hover:underline group-hover:underline-offset-4">
        {project.title}
      </h3>
      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{project.summary}</p>
    </Link>
  )
}
