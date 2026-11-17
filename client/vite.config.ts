import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // The version from package.json, which release-please bumps; see src/version.ts.
  define: { __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? '0.0.0') },
  test: {
    environment: 'jsdom',
    coverage: { provider: 'v8', reporter: ['text', 'lcov'] },
  },
})
