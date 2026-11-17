---
status: proposed
date: 2026-11-16
decision-makers: Abdulaziz (proposed)
---

# ADR-0003: Deploy the client to Cloudflare Workers

## Context and Problem Statement

The client builds to static files. warmup-charts published them to GitHub
Pages, but Pages is not available on a private repository in a Free
organization, and this repository stays private. Where does each release go?

## Considered Options

* GitHub Pages, from a second public repository holding only the build
* Cloudflare Pages
* Cloudflare Workers with static assets
* Netlify or Vercel

## Decision Outcome

Proposed option: **Cloudflare Workers with static assets**. It is free with
unlimited requests for a static site, keeps the source private, and is the
product Cloudflare recommends for new applications over Pages.

`client/wrangler.jsonc` names the Worker `portfolio`, points it at `dist`,
and serves `index.html` for unknown paths so client-side routing works. The
`deploy` job builds the client and runs `wrangler deploy` on every
`client-v*` tag (ADR-0005). The site is at
https://portfolio.atfolio.workers.dev.

One-time setup:

1. A Cloudflare account for the team, with `atfolio` as its `workers.dev`
   subdomain. Invite teammates under Manage Account > Members.
2. An API token from the "Edit Cloudflare Workers" template, with the zone
   row removed. Store it and the Account ID as `CLOUDFLARE_API_TOKEN` and
   `CLOUDFLARE_ACCOUNT_ID` in a CircleCI context named `Cloudflare`.
3. For a custom domain, move the domain's DNS to Cloudflare, then add it
   under the Worker's Settings > Domains & Routes. Choose the host name
   before the OAuth sign-in work, because the redirect URI depends on it.

### Consequences

* Good: free, and every deploy is kept, so rollback is a dashboard action.
* Good: a stable HTTPS address for the AT Protocol OAuth client metadata.
* Neutral: a deploy token lives in a CircleCI context, like the others.
* Bad: a custom domain needs the domain's nameservers on Cloudflare.

## Pros and Cons of the Options

### GitHub Pages from a public build repository

* Good: reuses the warmup-charts scripts unchanged.
* Bad: a second repository and a deploy key to look after.

### Cloudflare Pages

* Good: custom domains work through a CNAME at any DNS host.
* Bad: Cloudflare now recommends Workers; Pages is the older product.

### Cloudflare Workers with static assets

* Good: current product, one small config file, SPA routing built in.
* Bad: custom domains need Cloudflare DNS.

### Netlify or Vercel

* Good: free tiers and simple CLIs.
* Bad: another vendor and account, with usage caps.
