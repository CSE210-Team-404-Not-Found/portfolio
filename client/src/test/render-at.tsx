import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createMemoryHistory, RouterProvider } from '@tanstack/react-router'
import { render } from '@testing-library/react'
import { AuthContext, type Auth } from '../auth/auth-context.ts'
import { createAppRouter } from '../router.ts'

// signed out so the navbar doesn't try to load anything
// same idea as the FakeAuthProvider in LoginPage.test.tsx
const signedOut: Auth = {
  status: 'signed-out',
  signIn: async () => {},
  signOut: async () => {},
}

// opens the app at a path like /profile/alice.test with the real router
export function renderAt(path: string) {
  // useProfile retries server errors so retryDelay 0 means the tests don't sit and wait
  const queryClient = new QueryClient({ defaultOptions: { queries: { retryDelay: 0 } } })
  const router = createAppRouter(createMemoryHistory({ initialEntries: [path] }))

  render(
    <QueryClientProvider client={queryClient}>
      <AuthContext value={signedOut}>
        <RouterProvider router={router} />
      </AuthContext>
    </QueryClientProvider>,
  )
}
