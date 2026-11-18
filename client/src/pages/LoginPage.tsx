import { useState, type FormEvent } from 'react'
import { Navigate } from '@tanstack/react-router'
import { useAuth } from '../auth/auth-context.ts'
import { INVALID_HANDLE_MESSAGE, isValidHandle, normalizeHandle } from '../auth/handle.ts'

export function LoginPage() {
  const auth = useAuth()
  const [input, setInput] = useState('')
  // A typo caught here, before anything is sent. Errors from sign-in itself come from useAuth().
  const [formatError, setFormatError] = useState<string | null>(null)

  if (auth.status === 'signed-in') {
    return <Navigate to="/" />
  }

  const busy = auth.status === 'loading' || auth.status === 'redirecting'
  const error = formatError ?? (auth.status === 'signed-out' ? auth.error?.message : undefined)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const handle = normalizeHandle(input)
    if (!isValidHandle(handle)) {
      setFormatError(INVALID_HANDLE_MESSAGE)
      return
    }
    setFormatError(null)
    void auth.signIn(handle)
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-12">
      <h1 className="text-2xl font-semibold">Sign in to OpenShowcase</h1>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
        Use your Bluesky or other AT Protocol handle. You'll enter your password on your
        account's own sign-in page, not here.
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-3">
        <label htmlFor="handle" className="text-sm font-medium">
          Handle
        </label>
        <input
          id="handle"
          name="handle"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder="alice.bsky.social"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          disabled={busy}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'handle-error' : undefined}
          className="rounded-lg border border-neutral-300 bg-transparent px-3 py-2 outline-none focus:border-neutral-900 disabled:opacity-60 aria-invalid:border-red-500 dark:border-neutral-700 dark:focus:border-neutral-100 dark:aria-invalid:border-red-400"
        />
        {error && (
          <p id="handle-error" role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-neutral-900 px-4 py-2 font-medium text-white hover:bg-neutral-700 disabled:opacity-60 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
        >
          {auth.status === 'redirecting' ? 'Redirecting to sign in…' : 'Sign in'}
        </button>
      </form>

      <p className="mt-6 text-sm text-neutral-600 dark:text-neutral-400">
        Don't have an account?{' '}
        <a
          href="https://bsky.app"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-neutral-900 underline underline-offset-4 dark:text-neutral-100"
        >
          Create one on Bluesky
        </a>
      </p>
    </main>
  )
}
