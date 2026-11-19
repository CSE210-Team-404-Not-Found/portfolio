type ProfileHeroProps = {
  name: string
  handle: string
  jobTitle?: string
  intro?: string
  links?: { label: string; url: string }[]
}

// big section at the top of the figma profile page
// left side is job title + name and right side is the intro + links
export function ProfileHero({ name, handle, jobTitle, intro, links = [] }: ProfileHeroProps) {
  return (
    <section id="about" aria-label="About" className="grid gap-8 py-12 md:grid-cols-12 md:py-16">
      <div className="md:col-span-7">
        {jobTitle && (
          <p className="text-xs font-medium tracking-wider text-neutral-500 uppercase dark:text-neutral-400">
            {jobTitle}
          </p>
        )}
        {/* figma has a slogan here but nothing stores one yet so it's the name for now */}
        <h1 className="mt-3 text-4xl break-words sm:text-5xl md:text-6xl">{name}</h1>
        <p className="mt-3 text-neutral-500 dark:text-neutral-400">@{handle}</p>
      </div>

      <div className="md:col-span-5 md:pt-8">
        {intro && <p className="whitespace-pre-line break-words">{intro}</p>}

        {links.length > 0 && (
          <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {links.map((link) => (
              <li key={link.url}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="underline-offset-4 hover:underline"
                >
                  {link.label} ↗
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
