// bottom of the figma profile page
export function ProfileFooter({ name }: { name: string }) {
  const year = new Date().getFullYear()

  return (
    <footer className="flex flex-wrap justify-between gap-2 border-t border-neutral-200 pt-6 text-xs text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
      <span>
        © {year} {name}
      </span>
      <span>Made with OpenShowcase</span>
    </footer>
  )
}
