// top bar of someone's portfolio from Loisel's figma (02 / Profile page)
// this is separate from the site navbar in Header.tsx
export function ProfileNav({ name, avatar }: { name: string; avatar?: string }) {
  return (
    <nav
      aria-label="Portfolio sections"
      className="flex items-center justify-between gap-4 border-b border-neutral-200 pb-4 dark:border-neutral-800"
    >
      <span className="flex min-w-0 items-center gap-3">
        {avatar ? (
          <img src={avatar} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
        ) : (
          // no profile picture so just show the first letter of their name
          <span
            aria-hidden="true"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-sm font-medium dark:bg-neutral-700"
          >
            {name[0].toUpperCase()}
          </span>
        )}
        <span className="truncate font-medium">{name}</span>
      </span>

      {/* these jump down to the sections with id="work" and id="about" */}
      <ul className="flex shrink-0 gap-5 text-sm text-neutral-600 dark:text-neutral-400">
        <li>
          <a href="#work" className="hover:text-neutral-900 dark:hover:text-neutral-100">
            Work
          </a>
        </li>
        <li>
          <a href="#about" className="hover:text-neutral-900 dark:hover:text-neutral-100">
            About
          </a>
        </li>
      </ul>
    </nav>
  )
}
