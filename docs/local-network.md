# Local network

How to run the client against a local AT Protocol network instead of the
real one, and what is in it. The decision behind it is ADR-0006.

## Starting and stopping

```sh
docker compose up      # at the repository root; the first run builds the image
cd client
npm run dev:docker     # the client on http://127.0.0.1:5173, pointed at the local network
```

`npm run dev` still uses the real network. `docker compose down` stops the
local one. Every start is a fresh network: the accounts get new DIDs, and
anything created during a session is gone.

## Accounts

`@atproto/dev-env` creates these accounts on the local PDS at every start.
Sign in with the handle and password on the PDS's sign-in page.

| Handle | Password | What it is |
|---|---|---|
| `alice.test` | `hunter2` | Alice, "Test user 0" |
| `bob.test` | `hunter2` | Bob, "Test user 1" |
| `carla.test` | `hunter2` | Carla, "Test user 2" |
| `labeler.test` | `hunter2` | A labeler service with a few labels |
| `triage.test` | `triage-pass` | Ozone moderation role |
| `mod.test` | `mod-pass` | Ozone moderation role |
| `admin-mod.test` | `admin-mod-pass` | Ozone moderation role |

Alice, Bob and Carla follow each other and have a few posts, some with
images, and two custom feeds between them, so the AppView has something to
show. Ozone is not exposed, so the client has no use for the moderation
accounts.

## Services

| Port | Service |
|---|---|
| 2581 | Introspection: `GET http://localhost:2581/` lists every service's URL and DID |
| 2582 | PLC directory |
| 2583 | PDS: sign-in, OAuth, repositories, blobs |
| 2584 | Bluesky AppView |

Postgres and Redis run beside them for the AppView and are not exposed.
`client/.env.docker` points the client at 2582 and 2583.

## Checking it

```sh
curl "http://localhost:2583/xrpc/com.atproto.identity.resolveHandle?handle=alice.test"
curl "http://localhost:2584/xrpc/app.bsky.actor.getProfile?actor=alice.test"
```

The first returns Alice's DID from the PDS, the second her profile from the
AppView. `docker compose logs atproto` shows the startup log.

## Upgrading

`docker/atproto/Dockerfile` pins the `@atproto/dev-env` version. Change it
there and run `docker compose build`.
