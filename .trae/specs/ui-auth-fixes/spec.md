# QaitaJanaru - UI Card Restoration + Authentication Performance Optimization

## Overview
- **Summary**: Fix two specific production issues: (1) restore missing card/container styling on Profile, Leaderboard, and Rewards pages using the existing shared design system, and (2) optimize the login/registration authentication flow that currently takes ~1 minute or more.
- **Purpose**: Restore the visual structure that makes the app usable and bring authentication performance to an acceptable level so users can enter the website quickly.
- **Target Users**: All QaitaJanaru end users on web (desktop + mobile), covering both new account creation and existing account login flows.

## Goals
1. Restore visual cards/panels/containers on the Profile page so information is clearly separated.
2. Restore the missing partial card/container styling on Leaderboard and Rewards pages without touching sections that are already correct.
3. Preserve the existing QaitaJanaru visual system (colors, gradients, branding, content, navigation) exactly as-is.
4. Reduce end-to-end login and registration duration from ~60+ seconds to an acceptable interactive level.
5. Maintain full security, authentication integrity, and existing account data.

## Non-Goals
1. Redesigning any page visually. Only restore what belongs based on the existing design system.
2. Modifying Settings, Recycling Map, Scanner, Tasks, Login, or Registration pages' visual appearance unless a shared root-cause fix technically requires it.
3. Removing security/authentication checks merely to make the flow appear faster.
4. Changing database schemas or deleting/modifying user data.
5. Introducing a new state-management library or global redesign layer.
6. Adding new product features or changing existing page navigation.

## Background & Context
The repository is a Next.js 15 (App Router) frontend with a FastAPI + SQLAlchemy backend.

**Shared UI pattern (confirmed working on Settings page)**: Cards use the combination of:
- Inline `backgroundColor: colors.cardBg` (from `ThemeContext`, matches the active theme such as Emerald/Dark/Light)
- Inline `borderColor: colors.border`
- Tailwind classes `rounded-xl backdrop-blur-xl border overflow-hidden` (or equivalent `rounded-3xl` for larger cards)

**Broken pattern on Profile/Leaderboard/Rewards pages**: Cards rely solely on the `.app-card` CSS utility class defined in `app/globals.css`. That utility currently reads:
```
.app-card { background: var(--surface); border-radius: var(--card-radius); box-shadow: var(--card-shadow); }
```
`--surface` and other CSS variables are driven only by `prefers-color-scheme` (system light/dark), NOT by the in-app ThemeContext (emerald/violet/ocean/cyan/sunset/light/dark selection). Additionally, `.app-card` has no `border` and no `backdrop-filter: blur`, so the glassmorphism card visual disappears on themes that don't coincidentally match the OS setting.

**Root cause (UI)**: `.app-card` class is incomplete and not wired to the dynamic ThemeContext. Working pages bypass it with theme-aware inline styles, while broken pages rely on it.

**Authentication flow (end-to-end today for email login)**:
1. User submits login → `POST /auth/login` (backend runs `update_streak`, `record_login`, `auto_claim_completed_tasks`, all of which call `db.commit()` + `db.refresh()` several times)
2. Frontend stores basic fields in localStorage and `router.push("/profile")`
3. Profile page mounts → `GET /profile/{user_id}`
4. Backend profile endpoint:
   - Calls `apply_inactivity_penalty()` which commits/refreshes the user up to 3 separate times
   - Calls `sync_usage_limits()` and another commit/refresh if `local_date` present
   - Calls `_serialize_profile()` which:
     - Loads *all* RecyclingSubmission rows for the user (no SQL limit)
     - For EACH submission, runs a separate `.first()` query against RecyclingPoint → classic N+1 queries
     - Iterates every submission in Python to build material totals and recent_activity (takes last 8 of list built in memory)
5. After login, every other protected page independently calls `getProfile()` again, so the same heavy serialization repeats on first navigation to Tasks/Leaderboard/Rewards/Settings/Map/Scanner.

**Google OAuth path** compounds this further because after `POST /auth/google` the login page additionally calls `getProfile()` itself (for city check → `/select-city`) before redirecting. Select-city then calls `getProfile()` again before finally sending user to `/profile` which calls it a third time. That is 3–4 full profile serializations in sequence before the app is usable.

**Root causes (auth slowness)**:
- Backend N+1 queries in `_serialize_profile` → 1 query per submission.
- Backend loads and iterates ALL RecyclingSubmissions in Python instead of aggregating in SQL.
- Multiple sequential `db.commit()` + `db.refresh()` round-trips in `apply_inactivity_penalty` and `update_streak`, even when nothing materially changed.
- Frontend performs redundant serial `getProfile()` calls across the login → select-city → profile handoff, and again on every page mount without short-term caching.

## Functional Requirements
- **FR-1**: Profile page renders all its sections (header, stats grid, materials list, distribution bars, recent activity, level progress) inside visually distinct cards/panels that match the glassmorphism card appearance used on Settings page for the active theme.
- **FR-2**: Leaderboard page renders its tabs container, leaderboard list container, table rows, and loading/error/empty states using cards/panels matching the shared style; any sections that already render correctly remain unchanged.
- **FR-3**: Rewards page renders its tabs/filter bar, rewards grid cards, partners grid cards, and empty states with proper card/panel styling matching shared style; already-correct sections remain unchanged.
- **FR-4**: Settings, Recycling Map, Scanner, Tasks, Login, and Registration pages' visual output must be identical to current production output after the fix (no visual regression).
- **FR-5**: Registration (email) saves user, redirects into protected area, shows Profile page with loaded data.
- **FR-6**: Login (email) with valid credentials authenticates and redirects into protected area quickly.
- **FR-7**: Login with Google OAuth works; if city is missing the user is sent to select-city then to profile, without re-running full profile serialization more than necessary.
- **FR-8**: Logout clears session; login again functions identically to first login.
- **FR-9**: Protected routes (Profile, Leaderboard, Rewards, Tasks, Recycling Map, Scanner, Settings, Eco Assistant) still redirect unauthenticated users to `/login`.

## Non-Functional Requirements
- **NFR-1**: UI must remain fully responsive across mobile and desktop breakpoints for every modified page.
- **NFR-2**: `.app-card` must behave correctly for all 7 in-app themes (emerald, violet, ocean, cyan, sunset, light, dark).
- **NFR-3**: Theme change via Settings must immediately reflect on card background/border everywhere (Profile/Leaderboard/Rewards + any existing `.app-card` usage) without page reload.
- **NFR-4**: Authentication end-to-end (submit login → profile page content interactive) must complete in a time that no longer feels like ~1 minute. The backend profile serialization specifically must complete in well under 1 second for users with up to thousands of submissions (database roundtrip count reduction is primary evidence).
- **NFR-5**: No credentials, tokens, or secrets are logged to console or responses.
- **NFR-6**: No database schema changes; use pure SQLAlchemy query optimization + safe field defaults only.

## Constraints
- **Technical**:
  - Next.js App Router with `"use client"` pages; do not convert pages to RSC.
  - Tailwind + inline style + CSS utility class hybrid design system already in use; preserve this approach for the fix.
  - FastAPI + SQLAlchemy ORM backend. Use SQLAlchemy-idiomatic fixes (joinedload, subquery, aggregation functions) rather than raw SQL unless strictly necessary.
  - Do not add a third-party authentication library; keep the existing localStorage + backend API auth model.
- **Business**:
  - Do NOT redesign the website. Preserve exact content, colors, gradients, spacing, and component-level visual hierarchy.
  - Do NOT modify Settings, Recycling Map, Scanner, Tasks, Login, or Registration pages' visual structure unless the same shared `.app-card` class drives their cards (the hamburger button does use `.app-card` on Leaderboard/Rewards; this is permitted to improve because it is root-cause).
- **Dependencies**: No new runtime dependencies allowed for this change.

## Assumptions
- Existing users have `RecyclingSubmission` rows (potentially hundreds/thousands). The N+1 query is a real bottleneck, not theoretical.
- User typically opens the app from one tab/browser; a short-lived in-memory frontend cache of profile data (e.g., 30–60 seconds TTL) will not cause staleness issues.
- The 7 registered themes are the only supported themes; CSS variable injection can cover all of them.

## Acceptance Criteria

### AC-1: Profile page cards visually match shared design system (all themes)
- **Type**: `rule`
- **Given**: User is authenticated and has selected any available theme (emerald/violet/ocean/cyan/sunset/light/dark)
- **When**: Navigating to `/profile` and inspecting the header card, 4 stat cards, materials recycled section, recycling distribution section, and recent activity section
- **Then**: Every section appears inside a glassmorphism container with (a) rounded large corners, (b) translucent background matching the theme's `cardBg`, (c) a subtle border matching the theme's `border`, (d) backdrop-blur, (e) a slight shadow; individual material rows and activity rows have their own rounded bordered sub-containers; nothing looks like plain text on the background.
- **Pass Condition**: All 5 sections render as cards visually matching Settings' row-card visual style on both desktop and mobile widths for every theme; DOM/CSS shows the card styling is applied via the shared mechanism (CSS variables from ThemeContext + `.app-card` class and/or inline styles consistent with Settings), not via ad-hoc random one-off classes per page.
- **Evidence**: Screenshots of Profile page for emerald and light themes at mobile and desktop widths; CSS computed styles for the header card confirming `backgroundColor === colors.cardBg`, `borderColor === colors.border`, `backdrop-filter === blur()`.

### AC-2: Leaderboard + Rewards partial container restoration
- **Type**: `rule`
- **Given**: User authenticated on any theme
- **When**: Navigating to `/leaderboard` and `/rewards` (both tabs: rewards + partners, both tabs: global + cities) and comparing each container against the working pattern
- **Then**: Tabs container, main list/grid container, empty state, error container all have proper cards/panels; reward/partner individual cards look visually contained; the hamburger `.app-card` buttons render with the same glass styling as the Settings hamburger; any sections that were already correct remain visually unchanged.
- **Pass Condition**: No section on either page looks like "unstyled plain text on background"; the `HelpCard` component (if used) is unchanged; mobile and desktop widths both contain content correctly.
- **Evidence**: Screenshots of Leaderboard (both tabs) and Rewards (both tabs) at two widths; visual comparison against Settings page that the card family (border, blur, bg) matches.

### AC-3: No visual regression on correctly-styled pages
- **Type**: `rule`
- **Given**: Any theme selected
- **When**: Opening Settings, Recycling Map, Scanner, Tasks, Login, Registration pages
- **Then**: Visual output is pixel-identical (or indistinguishable) to pre-fix state; no new borders, no missing containers, no changes to spacing/typography/colors; hamburger menu buttons (if they use `.app-card`) still render consistently.
- **Pass Condition**: Side-by-side screenshot or DOM diff (manual check) of Settings cards showing no visual regression; Recycling Map and Scanner overlays/buttons unchanged; Tasks task cards unchanged; auth pages gradient + card layout unchanged.
- **Evidence**: Screenshots of Settings, Tasks, Login pages confirming same look; lint/typecheck passing showing no broken references to Settings/Map/Scanner/Tasks components.

### AC-4: Auth flow completes quickly (backend DB roundtrip reduction)
- **Type**: `rule`
- **Given**: Backend running, database with at least one user that has ≥ 1 RecyclingSubmission record
- **When**: Calling `GET /profile/{user_id}` endpoint
- **Then**: Total SQL queries for the request drops from 1 + N (N submissions) to ≤ 4 constant queries regardless of submission count; material totals and recent activity still compute correctly; `apply_inactivity_penalty` issues at most one `db.commit()`/`db.refresh()` pair per request (not 3+).
- **Pass Condition**: SQLAlchemy `echo=True` log (or similar instrumentation) shows 1 query for user + 1 aggregated or joined query for submissions + 1 query for recycling points data (if not already joined), totaling ≤ 4; response JSON structure is identical to pre-fix.
- **Evidence**: Server logs showing ≤ 4 SQL queries for one `/profile` call; same response shape validated against pre-fix output.

### AC-5: Login/registration end-to-end interactive time substantially improved
- **Type**: `rubric`
- **Dimension**: End-to-end duration from "submit login/registration form" to "profile page data displayed and interactive"
- **Scale**: 0–3
- **Anchors**: 0 = still ~60s or worse; 1 = ~20–30s (moderate improvement but still slow); 2 = ~3–10s (fast enough to feel like a normal web app); 3 = ≤ 2s (instant-feeling snappy entry)
- **Pass Threshold**: ≥ 2
- **Evidence**: Timing trace from DevTools Network/Performance panel or manual start→end measurement for email login and registration flows; before/after duration comparison.

### AC-6: Redundant front-end `getProfile()` calls eliminated across auth handoff
- **Type**: `rule`
- **Given**: Standard OAuth or email login flow
- **When**: Tracing from login submit → select-city (if applicable) → profile mount
- **Then**: The heavy full serialization `/profile/{user_id}` endpoint is called at most ONCE across the entire handoff, not 2–4 times sequentially; each following page navigation uses a short TTL cache or localStorage snapshot for the header data and only re-fetches when stale or explicitly needed.
- **Pass Condition**: DevTools Network tab shows ≤ 1 `GET /profile/*` request during login→redirect→page render; each protected page still re-fetches profile data only if no fresh copy exists (e.g., 30s+ since last fetch or explicitly forced via reload/action).
- **Evidence**: Network panel HAR or screenshot showing request count across login→profile for both email and Google flows.

### AC-7: All pages still authenticate and no data corruption
- **Type**: `rule`
- **Given**: An existing user with eco points > 0 and at least one submission.
- **When**: (1) Log out and log in again, (2) open Profile, (3) open Leaderboard, (4) open Rewards, (5) open Settings, (6) navigate to any protected page without being logged in.
- **Then**: User ID/eco points/level/streak values remain consistent with what they were before the fix; no submission or user data is mutated or deleted; unauthenticated navigation still redirects to `/login`; Settings page logout still clears session; form validation on login/register still works; Google login still works when `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set.
- **Pass Condition**: Spot-check of 3 users' before/after `eco_points`, `level`, `streak` unchanged; screenshot or record of redirect chain for unauthenticated access test.
- **Evidence**: Spot-check database values and localStorage values after login/logout cycles; confirm no security checks were removed.

## Open Questions
None. Both issues were fully characterized by repository inspection above.
