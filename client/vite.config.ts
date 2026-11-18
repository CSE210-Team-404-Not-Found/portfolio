import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import { defineConfig } from 'vitest/config'
import { buildClientMetadata } from './src/auth/client-metadata.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), oauthClientMetadata()],
  // The version from package.json, which release-please bumps; see src/version.ts.
  define: { __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? '0.0.0') },
  // Sign-in during development only works on 127.0.0.1, not localhost
  // (src/auth/oauth-client.ts).
  server: { host: '127.0.0.1' },
  preview: { host: '127.0.0.1' },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: { provider: 'v8', reporter: ['text', 'lcov'] },
  },
})

/**
 * Writes the OAuth client metadata to dist/client-metadata.json when
 * VITE_APP_URL is set, as it is for production builds (.env.production).
 * Sign-in servers fetch this file to learn about the app.
 */
function oauthClientMetadata(): Plugin {
  let appUrl: string | undefined
  return {
    name: 'oauth-client-metadata',
    apply: 'build',
    configResolved(config) {
      appUrl = config.env.VITE_APP_URL
    },
    generateBundle() {
      if (!appUrl) return
      this.emitFile({
        type: 'asset',
        fileName: 'client-metadata.json',
        source: `${JSON.stringify(buildClientMetadata(appUrl), null, 2)}\n`,
      })
    },
  }
}
