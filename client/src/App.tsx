import { useState } from 'react'
import './App.css'
import { useAuth } from './auth/auth-context.ts'
import { AuthProvider } from './auth/AuthProvider.tsx'

// A minimal screen for trying sign-in. The designed /login page and the
// signed-in header are #19.
function App() {
  return (
    <AuthProvider>
      <main className="auth-demo">
        <h1>ATFolio</h1>
        <SignIn />
      </main>
    </AuthProvider>
  )
}

function SignIn() {
  const auth = useAuth()
  const [handle, setHandle] = useState('')

  if (auth.status === 'loading') {
    return <p>Loading…</p>
  }

  if (auth.status === 'signed-in') {
    return (
      <section className="auth-card">
        <p>
          Signed in as <strong>@{auth.session.handle}</strong>
        </p>
        <code className="auth-did">{auth.session.did}</code>
        <button type="button" onClick={() => void auth.signOut()}>
          Sign out
        </button>
      </section>
    )
  }

  const redirecting = auth.status === 'redirecting'
  const error = auth.status === 'signed-out' ? auth.error : undefined

  return (
    <form
      className="auth-card"
      onSubmit={(event) => {
        event.preventDefault()
        void auth.signIn(handle)
      }}
    >
      <label htmlFor="handle">Handle</label>
      <input
        id="handle"
        name="handle"
        placeholder="alice.bsky.social"
        autoComplete="username"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        required
        disabled={redirecting}
        value={handle}
        onChange={(event) => setHandle(event.target.value)}
      />
      <button type="submit" disabled={redirecting}>
        {redirecting ? 'Redirecting…' : 'Sign in'}
      </button>
      {error && (
        <p className="auth-error" role="alert">
          {error.message}
        </p>
      )}
      <p>
        Don't have an account?{' '}
        <a href="https://bsky.app/" target="_blank" rel="noreferrer">
          Create one on Bluesky
        </a>
      </p>
    </form>
  )
}

export default App
