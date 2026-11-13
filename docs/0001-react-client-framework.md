---
status: accepted
date: 2026-11-12
decision-makers: Team members present at 11/12 after lecture meeting
---

# ADR-0002: Use React for the front end

## Context and Problem Statement

We need to choose how to build the project's user interface. The choice affects
developer productivity, onboarding, tooling, and long-term maintainability.

## Considered Options

* Plain HTML/CSS/JavaScript (no framework)
* React
* Angular

## Decision Outcome

Chosen option: **React**, because it gives us a component model and a large
ecosystem without the weight and rigidity of a full framework like Angular.

### Consequences

* Good: reusable, composable components keep UI code organized as the app grows.
* Good: large ecosystem, community support, and a big hiring/onboarding pool.
* Good: declarative, state-driven rendering. React's virtual DOM reconciles
  state changes and applies only the necessary updates to the real DOM, so we
  don't hand-write DOM manipulation, and UI updates within the SPA stay
  efficient without full page reloads.
* Good: lighter and more flexible than Angular; we choose our own routing,
  state management, and tooling.
* Bad: a build step and toolchain are now required (bundler, transpiler, dev server).
* Bad: more dependencies to keep updated and secure.
* Bad: team members need to be comfortable with JSX and React's mental model.

## Pros and Cons of the Options

### Plain HTML/CSS/JavaScript

* Good: no build step and no dependencies.
* Good: minimal learning curve and fast initial load.
* Bad: no built-in structure; code tends to become hard to maintain as the UI grows.
* Bad: state management and DOM updates must be hand-rolled.
* Bad: reusable UI pieces require our own conventions.

### React

* Good: component-based architecture and declarative UI.
* Good: huge ecosystem and strong community support.
* Good: virtual dom state-drive rendering.
* Good: incremental adoption; flexible about surrounding tooling.
* Good: the framework most team members already have experience with, which shortens onboarding.
* Bad: not everyone on the team has used React, so some members will need time to get up to speed.
* Bad: requires a build toolchain.
* Bad: unopinionated, so we must decide on routing, state, and project structure ourselves.

### Angular

* Good: full-featured and opinionated (routing, forms, DI, and testing built in).
* Good: consistent structure across large teams.
* Bad: steepest learning curve (TypeScript, RxJS, decorators, modules).
* Bad: heaviest setup and bundle size of the three options.
* Bad: more framework than this project likely needs.
