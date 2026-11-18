import { useAuth } from '../auth/auth-context.ts'

export function HomePage() {
  const auth = useAuth()

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
      <h1 className="text-3xl font-semibold">OpenShowcase</h1>
      <p className="mt-3 text-neutral-600 dark:text-neutral-400">
        {auth.status === 'signed-in'
          ? 'You are signed in. Project pages are coming soon.'
          : 'Showcase your projects under an identity you own. Project pages are coming soon.'}
      </p>
    </main>
  )
}
