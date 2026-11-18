# Sign-in (AT Protocol OAuth)

Users sign in with their existing AT Protocol account (Bluesky or any other
host) through OAuth, using the official
[`@atproto/oauth-client-browser`](https://www.npmjs.com/package/@atproto/oauth-client-browser).
The app is a public browser client: there is no backend and no client secret.
Tokens are bound to a key kept in the browser (DPoP) and stored in IndexedDB.

## Using it in components

`<AuthProvider>` wraps the app in `App.tsx`. Any component can call
`useAuth()` (`auth-context.ts`):

```tsx
const auth = useAuth()

auth.status // 'loading' | 'signed-out' | 'redirecting' | 'signed-in'
auth.signIn('alice.bsky.social') // leaves for the account's sign-in page
auth.signOut()

if (auth.status === 'signed-in') auth.session // { did, handle }
if (auth.status === 'signed-out') auth.error // { kind, message } | undefined
```

Store the `did`, never the handle: handles can change. Error kinds are
`account-not-found`, `cancelled`, `network`, `session-expired`, `unsupported`
and `unknown`, and each comes with a message that can be shown as is.

## Development

`npm run dev` serves the app on <http://127.0.0.1:5173>. Without published
metadata, sign-in only works on a loopback IP, so opening `localhost` reloads
the page on `127.0.0.1`. Development uses a loopback client: no setup, but the
sign-in page can't show the app's name, and sessions last about a day.

Sign-in talks to the real network, so it needs a real account. For a local
network with throwaway accounts, run `docker compose up` at the repository
root and start the client with `npm run dev:docker` instead: `.env.docker`
points it at the local PLC directory and PDS. The accounts and ports are in
[docs/local-network.md](../../../docs/local-network.md).

## Production

The OAuth `client_id` is the URL of a JSON document describing the app.
`.env.production` sets `VITE_APP_URL`, and `npm run build` writes
`dist/client-metadata.json` from `client-metadata.ts`, so the deployed file is
at `<VITE_APP_URL>client-metadata.json`. Sign-in redirects back to
`VITE_APP_URL`. If the site moves, change `VITE_APP_URL`; existing users then
sign in again.

## Permissions

The app asks for `atproto`, `repo:com.at-folio.temp.profile`, and
`blob:image/*`. These grant identity, profile record writes, and image uploads.
Users with an older session need to sign out and sign in again to approve the
new permissions. Add a `repo:<collection>` scope to `OAUTH_SCOPE` before
writing any other record collections.
