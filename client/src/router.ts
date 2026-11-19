import {
  createRootRoute,
  createRoute,
  createRouter,
  type RouterHistory,
} from '@tanstack/react-router'
import { RootLayout } from './components/RootLayout.tsx'
import { HomePage } from './pages/HomePage.tsx'
import { LoginPage } from './pages/LoginPage.tsx'
import { ProfilePage } from './pages/ProfilePage.tsx'
import { ProjectPage } from './pages/ProjectPage.tsx'

const rootRoute = createRootRoute({ component: RootLayout })

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
})

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile/$handle',
  component: ProfilePage,
})

const projectRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile/$handle/project/$pid',
  component: ProjectPage,
})

const routeTree = rootRoute.addChildren([indexRoute, loginRoute, profileRoute, projectRoute])

/** Tests pass a memory history; the app uses the browser's history. */
export function createAppRouter(history?: RouterHistory) {
  return createRouter({ routeTree, history })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>
  }
}
