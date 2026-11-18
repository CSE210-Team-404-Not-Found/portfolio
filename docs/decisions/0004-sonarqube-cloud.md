---
status: proposed
date: 2026-11-16
decision-makers: Abdulaziz (proposed)
---

# ADR-0004: Analyze main and pull requests with SonarQube Cloud

## Context and Problem Statement

ESLint and the tests only find what they were written to find. Bugs,
duplicated code, security problems and untested code reach the reviewer.
warmup-charts reports a SonarQube Cloud analysis on every pull request.
Which analysis, and where does it run?

## Considered Options

* ESLint and the tests only
* SonarQube Cloud automatic analysis
* SonarQube Cloud analysis run from CircleCI

## Decision Outcome

Proposed option: **SonarQube Cloud from CircleCI**, through SonarSource's
orb, as on warmup-charts. Automatic analysis cannot import test coverage.

The `analyze` job runs on every pipeline but ends at once unless the commit
is on `main` or in a pull request, since the Free plan analyzes only those.
It runs `npm run coverage`, which is Vitest with V8 coverage writing
`client/coverage/lcov.info`, then the scanner uploads the analysis using
`sonar-project.properties` at the repository root. The project key is
`CSE210-Team-404-Not-Found_portfolio`; the first analysis creates the
project. SonarQube Cloud comments on the pull request through its GitHub
App, which is installed on the organization.

The repository is private. SonarQube Cloud's Free plan includes private
projects up to 50,000 lines of code.

One-time setup: none. The `SonarCloud` context with `SONAR_TOKEN` exists
from warmup-charts. After the first analysis, confirm the project appears on
sonarcloud.io.

### Consequences

* Good: each pull request shows new issues, coverage on new code and a
  quality gate verdict before anyone reads it.
* Neutral: the job repeats `npm ci` and the tests, a few seconds.
* Neutral: the quality gate asks for 80% coverage on new code. It informs
  the reviewer; without rulesets it cannot block a merge.
* Bad: if the project outgrows the Free plan, analysis stops.

## Pros and Cons of the Options

### ESLint and the tests only

* Good: nothing to set up.
* Bad: reviewers find bugs and untested code by hand, or not at all.

### SonarQube Cloud automatic analysis

* Good: no pipeline change.
* Bad: no test coverage.

### SonarQube Cloud from CircleCI

* Good: coverage included, and the analysis runs where the checks run.
* Bad: a properties file to keep in step with the layout.
