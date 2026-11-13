# OpenShowcase: User Stories

OpenShowcase lets developers and student teams showcase their projects under portable AT Protocol identities. Projects are hosted elsewhere (GitHub, Vercel, etc.); OpenShowcase stores each person's page about the project in their own account and links teammates' pages together.

**Priority:** **MVP** = needed for the first working version. **Later** = after the MVP. **On hold** = not planned for now.

**Roles**

- **Student developer:** builds projects and wants credit for their part
- **Teammate:** worked on the same project as someone else
- **Recruiter:** reviews portfolios and needs to know who did what
- **Organizer:** runs a hackathon or course

Numbers in the acceptance criteria (character limits, time windows) are placeholders to adjust.

## How collaboration works

- Every person who worked on a project has **their own page** for it, stored in their own account. Only they can edit it.
- A project is the set of pages linked together by **accepted invites**. On any of those pages, the linked pages appear as **tabs**.
- **Any member can invite.** One accepted invite is enough to join: if Maya invites Bob and Bob invites Lee, all three are linked.
- **Tab order:** the page you opened comes first, then everyone else in the order they joined.
- Nobody writes about anyone else, so there is nothing to confirm or re-confirm after edits. People can hide a tab from their own page but can't remove anyone from the project.

## Summary

| ID | Title | Priority |
|---|---|---|
| US-1 | Sign in with an existing account | MVP |
| US-2 | Keep my data if the site goes away | MVP |
| US-3 | Know what's public | MVP |
| US-4 | Create my project page | MVP |
| US-5 | Invite a teammate | MVP |
| US-6 | Accept or decline an invite | MVP |
| US-7 | Describe my part on my own page | MVP |
| US-8 | Switch between teammates' tabs | MVP |
| US-9 | Leave a project | MVP |
| US-10 | Hide a tab from my page | MVP |
| US-11 | Stay linked when someone in the middle leaves | MVP |
| US-12 | Post milestones and releases | Later |
| US-13 | Invite inbox | Later |
| US-14 | Endorse a teammate's page | Later |
| US-15 | Verified GitHub link | Later |
| US-16 | Share to Bluesky | Later |
| US-17 | Organizer-verified results | Later |
| US-18 | Browse projects | On hold |
| US-19 | Find projects that need help | On hold |
| US-20 | Discovery feed in Bluesky | On hold |

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

- **User Story Statement:** As a student developer, I want my project pages stored in my own account, so that I keep them if OpenShowcase shuts down.
- **Acceptance Criteria:**
  - Every project page, invite and join is saved in its author's own repo, not in an OpenShowcase database.
  - The records can be viewed with any AT Protocol repo browser, without OpenShowcase.
  - Records refer to people by their permanent account ID (DID), not their handle.
  - If a user moves their account to a different hosting provider, their projects still appear.

### US-3 · Know what's public (MVP)

- **User Story Statement:** As a student developer, I want to be warned that what I publish is public and may survive deletion, so that I don't post something I'll regret.
- **Acceptance Criteria:**
  - The warning appears before the user's first publish, and they must acknowledge it once to continue.
  - The warning says that deleted content may still exist in copies held by others.

---

## Projects

### US-4 · Create my project page (MVP)

- **User Story Statement:** As a student developer, I want to create a page for a project with a title, summary, description, tech stack, links and screenshots, so that I can show what I built.
- **Acceptance Criteria:**
  - Title (1–100 characters) and a plain-text summary (1–200 characters) are required; everything else is optional.
  - The description uses a rich-text editor limited to headings, bold, italic, lists and links.
  - Links must use `http`, `https` or `mailto`; anything else shows an inline error.
  - Up to 5 screenshots; an image over 1 MB is rejected with a message stating the limit.
  - The page has a public URL that loads without signing in.

### US-12 · Post milestones and releases (Later)

- **User Story Statement:** As a student developer, I want to post milestones and releases on my project page, so that viewers can see how the project grew.
- **Acceptance Criteria:**
  - A release requires a version and date; notes and a link are optional.
  - Two releases with the same version number are blocked.
  - Milestones with a future date show as "Planned."

---

## Collaboration

### US-5 · Invite a teammate (MVP)

- **User Story Statement:** As a project member, I want to invite a teammate by their handle, so that their page for the project is linked to mine.
- **Acceptance Criteria:**
  - Any member of the project can invite, not just the person who created the first page.
  - Inviting creates a link the inviter shares themselves (text, Slack, email); there is no in-app inbox in the MVP.
  - The invite works only for the account it names and expires after 7 days.
  - A handle that doesn't exist shows an error, and no invite is created.
  - Inviting someone who is already a member is blocked.
  - Pending invites are not shown publicly, and the inviter can cancel one before it's accepted.

### US-6 · Accept or decline an invite (MVP)

- **User Story Statement:** As an invited teammate, I want to accept or decline an invite, so that I'm only linked to projects I actually worked on.
- **Acceptance Criteria:**
  - Opening the invite link shows the project and who invited me.
  - Accepting creates my own page for the project, prefilled with the inviter's title, summary and links, which I can edit before publishing.
  - Declining creates nothing and links nothing.
  - Opening the link while signed in as a different account shows "This invite is for @bob."
  - An expired or cancelled invite shows a clear message instead of an error.

### US-7 · Describe my part on my own page (MVP)

- **User Story Statement:** As a teammate, I want to describe the project in my own words on my own page, so that viewers see what I did, not just that I was on the team.
- **Acceptance Criteria:**
  - Only I can edit my page; teammates can't edit it and I can't edit theirs.
  - I can add role tags (frontend, ML, design…) to my page.
  - My title and summary can differ from my teammates'.
  - Editing my page needs no approval from anyone.

### US-8 · Switch between teammates' tabs (MVP)

- **User Story Statement:** As a recruiter, I want to switch between each teammate's page for the same project, so that I can compare what each person says they did.
- **Acceptance Criteria:**
  - A project page shows a tab for every linked member.
  - The page I opened is the first tab; the rest follow in the order members joined.
  - Each tab shows the person's name, role tags and "Invited by …".
  - Switching tabs changes the URL, so any tab can be shared directly.
  - If a member's page can't be loaded (deleted account, host down), their tab is skipped and the rest of the page still works.
  - Tabs work without signing in.

### US-9 · Leave a project (MVP)

- **User Story Statement:** As a teammate, I want to leave a project, so that I'm no longer linked to work I don't want associated with me.
- **Acceptance Criteria:**
  - Leaving removes my tab from every other member's page.
  - I choose whether to keep my page as a standalone project or delete it.
  - Teammates' pages are unaffected; the people I invited stay linked to the rest of the project (US-11).

### US-10 · Hide a tab from my page (MVP)

- **User Story Statement:** As a teammate, I want to hide someone's tab from my page, so that I don't display people I don't want associated with my work.
- **Acceptance Criteria:**
  - Hiding affects only my page; the person stays in the project and their tab still shows on other members' pages.
  - I can unhide the tab later.
  - Nobody can remove another member from the project.

### US-11 · Stay linked when someone in the middle leaves (MVP)

- **User Story Statement:** As a teammate, I want the project to keep track of every member even if the person who invited someone leaves, so that tabs don't silently disappear.
- **Acceptance Criteria:**
  - When someone accepts an invite, their page stores the project's first page and every member at that moment.
  - When a signed-in member opens the project, newly found members are added to their own page's member list.
  - If Bob invited Lee and then leaves, Lee's page still shows Maya, and Maya's page shows Lee once Maya's member list has been refreshed.

### US-13 · Invite inbox (Later)

- **User Story Statement:** As an invited teammate, I want to see invites in the app, so that I don't depend on someone sending me a link.
- **Acceptance Criteria:**
  - Pending invites naming me appear in an inbox with the project and inviter.
  - Requires a backend that indexes invites across the network.

### US-14 · Endorse a teammate's page (Later)

- **User Story Statement:** As a teammate, I want to endorse a teammate's description of their work, so that viewers know someone else agrees with it.
- **Acceptance Criteria:**
  - An endorsement shows on the endorsed tab with who gave it and when.
  - If the endorsed page is edited after the endorsement, it shows as "Endorsed an earlier version."

---

## Credibility

### US-15 · Verified GitHub link (Later)

- **User Story Statement:** As a recruiter, I want proof that a candidate's GitHub account belongs to them, so that I can check their actual code.
- **Acceptance Criteria:**
  - The user proves ownership by posting a public gist containing a code OpenShowcase gives them.
  - "GitHub verified" appears only after the check passes.
  - If the gist is deleted, the badge is removed within 24 hours.

### US-17 · Organizer-verified results (Later)

- **User Story Statement:** As a hackathon organizer, I want to record a team's placement or participation, so that it appears on members' pages as verified by us.
- **Acceptance Criteria:**
  - The result shows the organizer as its source.
  - Only the organizer's account can create or remove it.
  - Members can hide it from their own page but can't edit it.

---

## Sharing

### US-16 · Share to Bluesky (Later)

- **User Story Statement:** As a student developer, I want to share my project page to Bluesky in one click, so that my followers see it.
- **Acceptance Criteria:**
  - I see a preview, and nothing is posted until I confirm.
  - The post links back to my project page.
  - Post text stays within Bluesky's 300-character limit.

---

## On hold: discovery

Discovery needs a backend that indexes projects across the network, so it is postponed. The records above are designed so an index can be added later without changing them.

### US-18 · Browse projects (On hold)

- **User Story Statement:** As a developer, I want to browse and filter projects by topic and tech stack, so that I can find interesting work.

### US-19 · Find projects that need help (On hold)

- **User Story Statement:** As a student looking for a team, I want to find projects looking for contributors, so that I can join one.

### US-20 · Discovery feed in Bluesky (On hold)

- **User Story Statement:** As a developer, I want to follow a feed of new projects in my Bluesky app, so that I see new work without visiting the site.
