# OpenShowcase: User Stories

OpenShowcase lets developers and student teams publish projects under portable AT Protocol identities, with contribution records that teammates confirm.

**Priority:** **MVP** = needed for the first working version. **Later** = after the MVP.

**Roles**

- **Student developer:** builds projects and wants credit for their part
- **Teammate:** worked on someone else's project
- **Recruiter:** reviews portfolios and needs to know who did what
- **Project seeker:** looking for a project to join
- **Organizer:** runs a hackathon or course

Numbers in the acceptance criteria (character limits, time windows) are placeholders to adjust.

## Summary

| ID | Title | Priority |
|---|---|---|
| US-1 | Sign in with an existing account | MVP |
| US-2 | Keep my data if the site goes away | MVP |
| US-3 | Know what's public | MVP |
| US-4 | Create a project page | MVP |
| US-5 | Add my team | MVP |
| US-6 | Keep credit if the owner deletes the project | MVP |
| US-7 | Post milestones and releases | Later |
| US-8 | Describe what I did | MVP |
| US-9 | Confirm or decline being credited | MVP |
| US-10 | Approve claims on my project | MVP |
| US-11 | No changing a claim after confirmation | MVP |
| US-12 | Withdraw a confirmation | MVP |
| US-13 | Dispute a claim | Later |
| US-14 | See what's confirmed | MVP |
| US-15 | See who confirmed each contribution | MVP |
| US-16 | Verified GitHub link | Later |
| US-17 | Browse projects | MVP |
| US-18 | Find projects that need help | Later |
| US-19 | Discovery feed in Bluesky | Later |
| US-20 | Share to Bluesky | Later |
| US-21 | Organizer-verified results | Later |

---

## Identity and data ownership

### US-1 · Sign in with an existing account (MVP)

- **User Story Statement:** As a student developer, I want to sign in with my existing Bluesky handle, so that my portfolio is tied to an identity I keep after I graduate.
- **Acceptance Criteria:**
  - Any AT Protocol handle works, including custom-domain handles (e.g. `maya.dev`) and accounts not hosted on bsky.social.
  - A handle that doesn't exist shows "We couldn't find that account" and creates no profile.
  - A user without an account sees a link to create one.
  - If a user changes their handle, their profile and projects stay linked to them.

### US-2 · Keep my data if the site goes away (MVP)

- **User Story Statement:** As a student developer, I want my projects and contributions stored in my own account, so that I keep them if OpenShowcase shuts down.
- **Acceptance Criteria:**
  - Every project, claim and confirmation is saved in its author's own repo, not only in the OpenShowcase database.
  - The records can be viewed with any AT Protocol repo browser, without OpenShowcase.
  - After the OpenShowcase database is wiped and rebuilt from the network, every page shows the same content as before.
  - If a user moves their account to a different hosting provider, their projects still appear.

### US-3 · Know what's public (MVP)

- **User Story Statement:** As a student developer, I want to be warned that what I publish is public and may survive deletion, so that I don't post something I'll regret.
- **Acceptance Criteria:**
  - The warning appears before the user's first publish, and they must acknowledge it once to continue.
  - The warning says that deleted content may still exist in copies held by others.
  - The claim form shows a one-line reminder every time.

---

## Projects

### US-4 · Create a project page (MVP)

- **User Story Statement:** As a student developer, I want to create a project page with a title, description, tech stack, links and screenshots, so that I can show what I built.
- **Acceptance Criteria:**
  - Title is required (1–100 characters); all other fields are optional.
  - Up to 5 screenshots; an image over 1 MB is rejected with a message stating the limit.
  - A link that doesn't start with `http://` or `https://` shows an inline error.
  - The page has a public URL that loads without signing in.
  - Edits appear on the page within 1 minute.

### US-5 · Add my team (MVP)

- **User Story Statement:** As a project owner, I want to add teammates by handle with a role, so that the project page shows everyone who built it.
- **Acceptance Criteria:**
  - Each added teammate shows as "Pending" until they confirm (US-9).
  - A handle that doesn't exist shows an error, and no one is added.
  - Adding the same person twice is blocked.
  - The owner can cancel a pending invite, which removes it from the teammate's inbox.

### US-6 · Keep credit if the owner deletes the project (MVP)

- **User Story Statement:** As a teammate, I want my confirmed contribution to stay on my profile if the owner deletes the project, so that one person can't erase everyone's credit.
- **Acceptance Criteria:**
  - After the owner deletes the project, confirmed contributors' profiles still list the contribution, marked "Project removed by owner."
  - The contribution still shows the project title as it was when I confirmed.
  - Pending (unconfirmed) contributions on a deleted project are removed.
  - The deleted project's URL shows "This project was removed" instead of an error page.
- **Note:** Depends on the team-ownership decision, so settle that first.

### US-7 · Post milestones and releases (Later)

- **User Story Statement:** As a project owner, I want to post milestones and releases, so that viewers can see how the project grew.
- **Acceptance Criteria:**
  - A release requires a version and date; notes and a link are optional.
  - Two releases with the same version number are blocked.
  - Milestones with a future date show as "Planned."
  - Releases appear on the project page newest first.

---

## Contribution claims

### US-8 · Describe what I did (MVP)

- **User Story Statement:** As a student developer, I want to describe my specific contribution to a project, so that viewers know what I did, not just that I was on the team.
- **Acceptance Criteria:**
  - A description (20–500 characters) and at least one role tag are required.
  - A new claim shows as "Claimed" until it is confirmed (US-9 or US-10).
  - A user has at most one claim per project; adding more work means editing it.

### US-9 · Confirm or decline being credited (MVP)

- **User Story Statement:** As a teammate, I want to confirm or decline when someone credits me, so that I'm never listed on work without agreeing.
- **Acceptance Criteria:**
  - Pending requests appear in an inbox showing the project, role and description.
  - Confirming changes the status to "Confirmed" on the project page and my profile within 1 minute.
  - Declining removes me from the project page, and the owner sees "Declined."
  - Requests with no response expire after 30 days and can be re-sent.
  - Only the person named can confirm; the owner can't confirm on their behalf.

### US-10 · Approve claims on my project (MVP)

- **User Story Statement:** As a project owner, I want to approve or reject contribution claims on my project, so that nobody can claim work on it that they didn't do.
- **Acceptance Criteria:**
  - Claims from people not on the team appear in the owner's inbox.
  - A rejected claim never shows as "Confirmed" anywhere and is hidden from the project page.
  - On the claimant's own profile, a rejected claim shows "Not confirmed by project owner."
  - The owner's own contribution must be confirmed by a teammate; owners can't confirm themselves.

### US-11 · No changing a claim after confirmation (MVP)

- **User Story Statement:** As a teammate, I want my confirmation to stop counting if the claim is changed afterward, so that nobody can change what I agreed to.
- **Acceptance Criteria:**
  - Editing the description or role of a confirmed claim resets it to "Needs re-confirmation."
  - Typo fixes also reset it; there is no "minor edit" exception.
  - The confirmer is notified and can re-confirm in one click.

### US-12 · Withdraw a confirmation (MVP)

- **User Story Statement:** As a teammate, I want to withdraw a confirmation, so that I can fix a mistake or distance myself from a project.
- **Acceptance Criteria:**
  - Withdrawing changes the status back to "Claimed" everywhere within 1 minute.
  - The other person is notified.
  - I can confirm again later.

### US-13 · Dispute a claim (Later)

- **User Story Statement:** As someone named in a claim I disagree with, I want to mark it as disputed, so that viewers see it's contested.
- **Acceptance Criteria:**
  - Only people named in the claim or the project owner can dispute it.
  - A disputed claim shows a "Disputed" flag, who raised it, and an optional reason (max 300 characters).
  - A disputed claim can't show as "Confirmed" until the dispute is withdrawn.

---

## Viewing (recruiter)

### US-14 · See what's confirmed (MVP)

- **User Story Statement:** As a recruiter, I want to see at a glance which contributions are confirmed and which are only claimed, so that I know which ones to trust.
- **Acceptance Criteria:**
  - Confirmed, Claimed and Needs re-confirmation each have a distinct text label, not color alone.
  - Profiles show a summary such as "4 of 5 contributions confirmed."
  - A legend explains each status.
  - All of this is visible without signing in.

### US-15 · See who confirmed each contribution (MVP)

- **User Story Statement:** As a recruiter, I want to see who confirmed each contribution and when, so that I can judge how much the confirmation is worth.
- **Acceptance Criteria:**
  - Each confirmed contribution lists every confirmer, linked to their profile, with the confirmation date.
  - If a confirmer deletes their account, the contribution goes back to "Claimed."

### US-16 · Verified GitHub link (Later)

- **User Story Statement:** As a recruiter, I want proof that a candidate's GitHub account belongs to them, so that I can check their actual code.
- **Acceptance Criteria:**
  - The user proves ownership by posting a public gist containing a code OpenShowcase gives them.
  - "GitHub verified" appears only after the check passes.
  - If the gist is deleted, the badge is removed within 24 hours.

---

## Discovery

### US-17 · Browse projects (MVP)

- **User Story Statement:** As a project seeker, I want to browse and filter projects by topic and tech stack, so that I can find interesting work.
- **Acceptance Criteria:**
  - Results match every selected tag.
  - Default sort is newest first.
  - No matches shows "No projects match" with a clear-filters button.
  - Browsing works without signing in.

### US-18 · Find projects that need help (Later)

- **User Story Statement:** As a project seeker, I want to find projects looking for contributors, so that I can join a team.
- **Acceptance Criteria:**
  - Owners can mark a project "Looking for contributors" and list the skills they need.
  - A filter shows only those projects.
  - The mark turns off after 60 days unless renewed, so the list stays current.

### US-19 · Discovery feed in Bluesky (Later)

- **User Story Statement:** As a developer, I want to follow a feed of new projects in my Bluesky app, so that I see new work without visiting the site.
- **Acceptance Criteria:**
  - At least one feed (e.g. "New projects") can be pinned in the Bluesky app.
  - New project posts appear in the feed within 5 minutes.
  - Projects from removed accounts don't appear.
- **Note:** Depends on US-20. Bluesky feeds can only show posts, so a project must be shared as a post to appear.

### US-20 · Share to Bluesky (Later)

- **User Story Statement:** As a student developer, I want to share a project or release to Bluesky in one click, so that my followers see it.
- **Acceptance Criteria:**
  - I see a preview, and nothing is posted until I confirm.
  - The post links back to the project page.
  - Post text stays within Bluesky's 300-character limit.
  - Nothing is ever posted automatically.

---

## Ecosystem

### US-21 · Organizer-verified results (Later)

- **User Story Statement:** As a hackathon organizer, I want to record a team's placement or participation, so that it appears on members' portfolios as verified by us.
- **Acceptance Criteria:**
  - The result shows the organizer as its source, separate from teammate confirmations.
  - Only the organizer's account can create or remove it.
  - Team members can hide it from their own profile but can't edit it.
