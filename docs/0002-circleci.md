---
status: proposed
date: 2026-11-16
decision-makers: Abdulaziz (proposed)
---

# ADR-0002: Run the checks on CircleCI

## Context and Problem Statement

The client has a linter, tests and a build, but nothing runs them when code
is pushed. Reviewers have to trust that the author ran them. The team used
CircleCI on the warmup project. Where do the checks run?

## Considered Options

* GitHub Actions
* CircleCI, connected through the CircleCI GitHub App

## Decision Outcome

Proposed option: **CircleCI**, as on warmup-charts. The team's CircleCI
organization, contexts and orbs already exist.

`.circleci/config.yml` defines the pipeline. The `check` job runs on every
push: `npm ci`, `npm run lint`, `npm test` and `npm run build` in `client/`,
the same commands a developer runs locally. It posts the status
`ci/circleci: check` on the pull request. The other jobs are covered by
ADR-0003, ADR-0004 and ADR-0005.

The repository is private on a Free organization, so GitHub rulesets are not
available and a red check cannot block a merge. The pull request template
asks the author to confirm the checks pass, and the reviewer looks at the
status.

One-time setup:

1. Give the CircleCI GitHub App access to the repository (organization
   Settings > Third-party Access > GitHub Apps > CircleCI).
2. In CircleCI, Projects > Create Project > GitHub App > this repository,
   with the "All pushes" trigger it proposes plus a "PR opened" trigger.
3. On GitHub, Settings > General > Pull Requests: squash merging only, title
   and description as the commit message, delete head branches
   automatically.

### Consequences

* Good: local and CI results agree, because they run the same commands.
* Good: one service for checks, analysis, releases and deploy.
* Bad: nothing blocks a merge with a failing check. A `main` ruleset can be
  added if the organization ever moves to GitHub Team.

## Pros and Cons of the Options

### GitHub Actions

* Good: nothing to connect.
* Bad: a second CI system beside the one the team already uses.

### CircleCI

* Good: the team's pipeline setup already exists.
* Bad: the GitHub App must be given access per repository.
