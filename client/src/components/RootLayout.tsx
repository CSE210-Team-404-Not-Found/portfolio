import { Outlet } from '@tanstack/react-router'
import { AuthErrorBanner } from './AuthErrorBanner.tsx'
import { Header } from './Header.tsx'

export function RootLayout() {
  return (
    <div className="flex min-h-svh flex-col">
      <Header />
      <AuthErrorBanner />
      <Outlet />
    </div>
  )
}
