import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { buildClientMetadata } from './src/auth/client-metadata.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), oauthClientMetadata()],
  // Sign-in during development only works on 127.0.0.1, not localhost
  // (src/auth/oauth-client.ts).
  server: { host: '127.0.0.1' },
  preview: { host: '127.0.0.1' },
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
