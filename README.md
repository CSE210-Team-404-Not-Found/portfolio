# Placeholder Name

A portfolio app built on the AT Protocol. Sign in with your existing atproto handle, publish projects to your own repo, and share your work across the network.

## Why ATFolio?
 
- **You own your portfolio.** Projects are stored as records in your own repo on your PDS, not in our database.
- **Portable.** Migrate to a different PDS and your portfolio comes with you.
- **Open.** Records use a public lexicon, so anyone can read them or build tools on top.
- **Social by default.** Share projects to Bluesky, follow creators, and discover work through feeds.
- **Verified identity.** Your domain handle (e.g. `alice.dev`) is your portfolio identity.

## Development

The client lives in `client/` and needs Node.js 24 or later, the version whose npm wrote the lockfile.

```sh
cd client
npm ci
npm run dev      # local server with hot reload
npm run lint
npm test
npm run build
```

CircleCI runs the lint, tests and build on every push and pull request,
analyzes `main` and pull requests with SonarQube Cloud, and deploys each
release tag to Cloudflare Workers at https://portfolio.atfolio.workers.dev
(ADR-0002 to ADR-0005 in `docs/`). How a change becomes a release is in
[docs/releases.md](docs/releases.md).
