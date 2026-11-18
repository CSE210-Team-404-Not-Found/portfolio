// OAuth client metadata for the deployed site.
//
// AT Protocol has no client registration and, for a browser app, no client
// secret. The client_id is the URL of this JSON document, which the user's
// authorization server fetches during sign-in. vite.config.ts writes it to
// dist/client-metadata.json at build time and oauth-client.ts uses the same
// object at runtime, so the two always match.
//
// Both the browser and the Vite config (Node) import this file, so it must
// not use browser or Node APIs.

/**
 * What the app asks the user to allow. `atproto` identifies the account; the
 * repo scopes grant profile and project record writes. Blob scopes allow the
 * image, JSON, and HTML uploads used by those records. Users with an older
 * session need to sign in again to grant these permissions.
 */
export const OAUTH_SCOPE =
  'atproto repo:com.at-folio.temp.profile repo:com.at-folio.temp.project blob:image/* blob:application/json blob:text/html'

/** Shown to the user on their authorization server's consent screen. */
const CLIENT_NAME = 'ATFolio'

/**
 * @param appUrl Where the app's index.html is served, e.g.
 *   `https://portfolio.atfolio.workers.dev/`. Sign-in redirects back here.
 */
export function buildClientMetadata(appUrl: string) {
  const base = new URL(appUrl)
  if (base.protocol !== 'https:') {
    throw new Error(`VITE_APP_URL must be an https:// URL, got ${appUrl}`)
  }
  if (!base.pathname.endsWith('/')) base.pathname += '/'
  base.search = ''
  base.hash = ''

  return {
    client_id: new URL('client-metadata.json', base).href,
    client_name: CLIENT_NAME,
    client_uri: base.href,
    redirect_uris: [base.href],
    scope: OAUTH_SCOPE,
    grant_types: ['authorization_code', 'refresh_token'],
    response_types: ['code'],
    token_endpoint_auth_method: 'none',
    application_type: 'web',
    dpop_bound_access_tokens: true,
  }
}
