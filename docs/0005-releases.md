---
status: proposed
date: 2026-11-16
decision-makers: Abdulaziz (proposed)
---

# ADR-0005: Version the client with release-please

## Context and Problem Statement

The client has no version, no tags and no changelog, and nobody can tell
which build is deployed. How does the team number releases, and how does
the changelog get written without anyone writing it?

## Considered Options

* release-please, through a release pull request
* git-cliff, run by hand
* semantic-release, pushing to `main`

## Decision Outcome

Proposed option: **release-please**, as on warmup-charts, driven by pull
request titles.

How it works:

1. Every pull request is squash-merged with a Conventional Commit title,
   `type(scope): subject`. `fix` bumps the patch version, `feat` the minor,
   a breaking change (`!` or a `BREAKING CHANGE:` footer) the major, or the
   minor while the major is 0. A GitHub Actions workflow checks the title
   on every pull request. It cannot block the merge on this private
   repository; the reviewer asks for the fix.
2. After each merge to `main`, the `release` job runs release-please. It
   keeps one release pull request open that bumps the version in
   `client/package.json` and writes `client/CHANGELOG.md` from the merged
   titles.
3. Merging the release pull request is the release. The next pipeline tags
   the commit `client-vX.Y.Z`, publishes a GitHub Release, and the tag
   deploys the site (ADR-0003). The tag carries the component name so a
   backend added later can release on its own, as `backend-vX.Y.Z`.
4. The build injects the version from `package.json`; `src/version.ts`
   exports it as `VERSION` for the page to show.

The day-to-day guide is `docs/releases.md`.

One-time setup:

1. Edit the fine-grained personal access token behind the CircleCI context
   `GitHub` to include this repository, with Contents and Pull requests
   read and write.
2. After this change merges, tag its merge commit `client-v0.1.0` with a
   GitHub Release as the baseline. That is also the first tag deploy.

### Consequences

* Good: the changelog and the version come from titles the team writes
  anyway, and a release is a reviewed pull request.
* Neutral: the site updates only when a release pull request is merged.
* Neutral: one small GitHub Actions workflow beside CircleCI, because only
  GitHub sees a title edit.
* Bad: a wrong title can be merged. It can be corrected afterward with a
  commit override in the merged pull request's description.

## Pros and Cons of the Options

### release-please

* Good: computes the version, writes the changelog, tags and publishes,
  all through a pull request.
* Bad: a token in CircleCI and a baseline tag to create once.

### git-cliff

* Good: a single binary.
* Bad: the version bump, pull request, tag and release are all by hand.

### semantic-release

* Good: fully automatic.
* Bad: commits and tags straight to `main`.
