---
status: proposed
date: 2026-11-17
decision-makers: Abdulaziz (proposed)
---

# ADR-0006: Develop against a local AT Protocol network

## Context and Problem Statement

Sign-in, and soon records (#18), talk to the AT Protocol network. In
development the client uses the real one: every developer needs a Bluesky
account, test data lands in real repositories, and nothing works offline.
What does a developer run locally?

## Considered Options

* The real network, with personal accounts
* The official PDS image, registering its accounts with the real PLC directory
* `@atproto/dev-env`, Bluesky's complete local network, in Docker Compose

## Decision Outcome

Proposed option: **`@atproto/dev-env` in Docker Compose**. It is the network
the atproto team develops its own clients against, and it needs nothing but
Docker.

`docker compose up` at the repository root builds a small image around
`@atproto/dev-env` and starts it with the Postgres and Redis it needs. One
container then runs a PLC directory (port 2582), a PDS with OAuth (2583), the
Bluesky AppView (2584) and an introspection page listing them all (2581). It
seeds test accounts. Nothing persists: every start is a fresh network.

`npm run dev:docker` in `client/` starts the client with `.env.docker`, which
points the handle resolver and the PLC directory at the local servers. The
OAuth client allows plain HTTP in development builds only. `npm run dev` still
uses the real network.

The end-to-end tests, `npm run test:e2e` in `client/`, start the same network
through Testcontainers and sign in against it with Playwright. CircleCI runs
them on `main` and pull requests, in a VM with Docker.

The day-to-day guide is `docs/local-network.md`.

### Consequences

* Good: throwaway accounts, no real data touched, works offline.
* Good: the AppView is there for profiles and feeds when #18 needs it.
* Good: the end-to-end tests have a real network, locally and in CircleCI.
* Neutral: the first `docker compose up` builds the image, a few minutes.
* Bad: the network forgets everything on restart, so test data beyond the
  seeded accounts is re-created by hand or by a script.
* Bad: one more tool to install, Docker Desktop.

## Pros and Cons of the Options

### The real network

* Good: nothing to run.
* Bad: personal accounts, real data, no offline work.

### The official PDS image

* Good: the same server that hosts production accounts.
* Bad: its accounts register with the real PLC directory, which never forgets
  them, and there is no AppView.

### `@atproto/dev-env` in Docker Compose

* Good: the whole network, seeded, in one command.
* Bad: a large image, and a package versioned by the atproto monorepo.
