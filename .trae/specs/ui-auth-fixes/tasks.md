# QaitaJanaru - UI + Authentication Fixes - Implementation Plan

## Task 1: Enhance `.app-card` CSS and inject theme CSS variables from ThemeContext
- **Status**: `pending`
- **Priority**: high
- **Depends On**: None
- **Description**:
  - In `app/contexts/ThemeContext.tsx`, on theme change (initial mount and `setTheme` call) write theme-driven values as CSS custom properties on `document.documentElement`:
    - `--app-card-bg` = `colors.cardBg`
    - `--app-card-border` = `colors.border`
    - `--app-card-shadow` = a theme-appropriate shadow using `colors.primary` (e.g. `0 6px 18px ${colors.primary}0F`)
    - `--app-card-blur` = `blur(20px)` or the same blur strength used in Settings (`backdrop-blur-xl` maps to `--tw-backdrop-blur: blur(24px)`)
  - In `app/globals.css`, redefine the `.app-card` utility so it is a complete, theme-aware card:
    - `background: var(--app-card-bg)` (replace `var(--surface)`; keeps `--surface` CSS variable as-is for any non-app usage)
    - `backdrop-filter: var(--app-card-blur)`
    - `-webkit-backdrop-filter: var(--app-card-blur)`
    - `border: 1px solid var(--app-card-border)`
    - `border-radius: var(--card-radius, 14px)` (keep existing)
    - `box-shadow: var(--app-card-shadow)` (upgrade existing)
    - Add `overflow: hidden` if safe (Settings uses it separately; do not force to avoid breaking layouts)
  - Add a matching `@theme inline` or root-level fallback default (emerald) so SSR/initial paint doesn't flash unstyled before hydration.
  - Verify that the ThemeContext `mounted` guard doesn't delay paint too long (currently returns `null`; keep current behavior but ensure variables are injected as early as the first `useEffect` fires so cards appear styled immediately).
- **Acceptance Criteria Addressed**: AC-1, AC-2, AC-3, NFR-2, NFR-3
- **Test Requirements**:
  - `rule` TR-1.1: With browser DevTools open, on any authenticated page with `.app-card` (Profile header, Leaderboard tabs, Rewards cards, hamburger buttons) the computed style for a card element shows `backgroundColor = colors.cardBg` as rgba (not `--surface` fallback), `borderWidth = 1px`, and `backdropFilter = blur(...)` for both Emerald theme and Light theme. Evidence: DevTools computed-style screenshot for one card.
  - `rule` TR-1.2: Changing the theme in Settings instantly updates the card background/border on Profile/Leaderboard/Rewards cards that are still mounted (no reload required). Evidence: Toggle theme in Settings modal while Profile page is open, then visually confirm cards re-paint.
  - `rule` TR-1.3: The Settings page row-cards (which do not use `.app-card`, they use explicit inline styles) continue to look identical before/after. Evidence: Settings screenshot comparison.
- **Notes**: The Settings page row-cards intentionally bypass `.app-card`; do not refactor them. Only `.app-card` consumers benefit from this task, which covers the hamburger buttons on Leaderboard/Rewards and every card currently tagged `app-card` on Profile/Leaderboard/Rewards.

## Task 2: Profile page targeted touch-ups (sub-container borders + nesting validation)
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 1
- **Description**:
  - Inspect the Profile page JSX in `app/profile/page.tsx`. With Task 1 complete, every top-level section that already has the `app-card` class will gain proper styling automatically.
  - For the internal sub-containers (material rows inside the "materials recycled" section, and the recent-activity row cards) that currently use only `rounded-2xl border px-4 py-3` or similar:
    - Ensure they use inline `backgroundColor` and `borderColor` via the theme's `colors.cardBg` and `colors.border` exactly like Settings does for its inner rows; this matches the design pattern used on the correctly-styled Settings rows (each Settings row has `colors.cardBg` as background). Do not rely on `.app-card` for these inner rows as they are smaller and already specify their own rounding.
    - Alternatively, if they already visually match after Task 1, leave them alone.
  - Audit the JSX nesting around lines 326–491 of the existing `profile/page.tsx` to verify every `<div className="grid ..." />` or card container sits inside the `space-y-8 md:space-y-10` wrapper correctly and there are no missing close/open tags that could collapse spacing between cards. Fix any structural issues if found (current reading suggests the nesting is correct; still verify).
  - Preserve 100% of existing content, icons, text, level badge, streak notification, name editing controls, material labels, progress bar, show-all activity button, sidebar gesture, and UserStatusHeader/QrHeaderAction wiring.
- **Acceptance Criteria Addressed**: AC-1, AC-3, FR-1, NFR-1
- **Test Requirements**:
  - `rule` TR-2.1: Profile page contains the following 5 containers all with visible cards in mobile and desktop viewports: (a) main profile header with avatar + level + name + eco points; (b) 2×2 (mobile) / 4-column (desktop) stat cards for total actions / total points / streak / level; (c) materials recycled section; (d) recycling distribution bars section; (e) recent activity + level progress section. Evidence: Screenshot with each section annotated.
  - `rule` TR-2.2: Material rows inside "materials recycled" section have rounded bordered containers with correct theme background. Evidence: Row-level computed style shows `backgroundColor === colors.cardBg`.
  - `rubric` TR-2.3: Visual consistency with Settings row cards. Dimension: "Card family consistency between Profile and Settings". Scale 1–5. 1 = completely different, 3 = same bg and radius but mismatched border/blur, 5 = indistinguishable look (matches the Settings rounded-card family). Pass threshold ≥ 4. Evidence: Side-by-side screenshot.

## Task 3: Leaderboard and Rewards missing-container audit and targeted fixups
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 1
- **Description**:
  - Leaderboard (`app/leaderboard/page.tsx`):
    - The tabs wrapper and the main leaderboard outer card currently use `app-card` (lines 187 and 215). After Task 1 these gain proper styling. No changes required unless they still look broken.
    - The HelpCard at the top (line 181-184) does NOT have `app-card`. It comes from `components/HelpCard.tsx`; check that component and ensure it either applies its own card styling (consistent with Settings) or add the styling inline.
    - The individual leaderboard entry rows (line 258-318) currently only set `backgroundColor` on top-3 ranks; leave them as-is (their visual design is intentionally lighter, per-spec "mostly working"). They are NOT broken containers.
    - Loading/error/empty state sections inside the leaderboard card (lines 217-232) already sit inside the outer card; confirm after Task 1 they render in the card, no change required unless they escape visually.
  - Rewards (`app/rewards/page.tsx`):
    - The main tabs/segmented control (lines 176-201) currently uses only `style={{ backgroundColor: ... }}` — this pattern is already explicit and correct; do not change it.
    - HelpCard at the top (line 174); check the same `HelpCard` component.
    - Reward cards (line 257) and partner cards (line 312) both already have `app-card`; these will be fixed by Task 1.
    - Category filter buttons (rewards tab, lines 204-220) are pill buttons, not cards; leave them alone.
    - Empty state cards (lines 226-229 and 301-304) have `app-card` and will be fixed by Task 1.
  - Shared `components/HelpCard.tsx`:
    - Review its current JSX output. If it uses inline styles matching Settings card style (backgroundColor + border + backdrop-blur + rounded), leave it. If it relies only on `.app-card` or is missing border/blur, apply the same inline card pattern Settings uses to this component (so both Leaderboard + Rewards + Tasks Help cards inherit properly).
- **Acceptance Criteria Addressed**: AC-2, AC-3, FR-2, FR-3, NFR-1
- **Test Requirements**:
  - `rule` TR-3.1: On Leaderboard, both the tabs container and the main list container have visible cards matching Profile's card family after ThemeContext CSS var injection. HelpCard renders with its proper card. Evidence: Screenshot.
  - `rule` TR-3.2: On Rewards page (both "Rewards" and "Partners" tabs), each reward/partner tile is a distinct card with bg+border+blur; empty state card renders similarly; HelpCard at top renders correctly; tabs segmented control still looks unchanged. Evidence: Screenshot for both tabs.
  - `rule` TR-3.3: Tasks page (consumer of HelpCard) and any other HelpCard usages (Eco Assistant if present) look unchanged. Evidence: Tasks HelpCard screenshot.

## Task 4: Fix backend N+1 queries and full-table loading in `_serialize_profile()`
- **Status**: `pending`
- **Priority**: high
- **Depends On**: None (independent from UI work; can be done in parallel with Tasks 1–3)
- **Description**:
  - In `app/backend/app/routers/profile.py`, function `_serialize_profile()` (lines 37–107):
    - Replace the naive `.all()` load of ALL RecyclingSubmission rows with two efficient SQL operations:
      1. Use SQL aggregation (`func.sum`, `group_by`) for per-material totals. Instead of iterating each submission in Python, build a query like:
         ```python
         from sqlalchemy import func
         # Build sums for each MATERIAL_FIELDS column, grouped by user, or (simpler) select sum(column) for each column in one row filtered by user_id.
         ```
         This yields a single-row result with all totals, avoiding the loop entirely.
      2. Query only the 8 most recent RecyclingSubmission rows, joined with RecyclingPoint via `joinedload` or explicit join so point names are fetched in one query (not N+1).
    - The current for-loop processes point lookup individually; restructure so the recent 8 submissions come pre-joined with their recycling point:
      ```python
      from sqlalchemy.orm import joinedload
      recent_submissions = (
          db.query(RecyclingSubmission)
          .options(joinedload(RecyclingSubmission.recycling_point_rel))  # if relationship defined, else join RecyclingPoint explicitly
          .filter(RecyclingSubmission.user_id == user.id)
          .order_by(RecyclingSubmission.created_at.desc())
          .limit(8)
          .all()
      )
      ```
    - Check `app/backend/app/models/recycling_submission.py` for existing relationship to RecyclingPoint; if not present, add a lightweight relationship (no schema migration needed for ORM relationship alone if FK exists; but confirm — if a migration is needed it's only adding the relationship property on ORM side, not ALTER TABLE).
    - Build `recent_activity` only from those 8 rows.
    - Material totals come from the SQL aggregation query (one row with 8 summed columns), not from iterating submissions.
    - Compute `total_recycling_actions` using `db.query(func.count(...))` on RecyclingSubmission filtered by user, OR rely on the aggregated query. This replaces `len(submissions)`.
    - Keep response shape identical (`analytics.total_recycling_actions`, `analytics.total_eco_points_earned`, `analytics.materials[]`, `analytics.recent_activity[]`) so the frontend doesn't break.
    - Still call `sync_user_level` before serializing (needed for correct level number) and keep existing `_validate_city` / profile update methods unchanged.
- **Acceptance Criteria Addressed**: AC-4, AC-7, NFR-4, NFR-6
- **Test Requirements**:
  - `rule` TR-4.1: Enable SQLAlchemy echo/query log. A single `GET /profile/{userId}` call produces ≤ 4 SQL queries (1 for User, 1 for aggregate submission totals/count, 1 for recent 8 submissions + joined point, plus any single queries from `apply_inactivity_penalty` which Task 5 fixes). Evidence: Server stdout query count snippet.
  - `rule` TR-4.2: JSON response from `/profile/{userId}` has identical top-level and `analytics` keys, types, and ordering compared to pre-fix (for an existing test user with ≥ 1 submissions). Evidence: JSON diff showing equal schema.
  - `rubric` TR-4.3: Latency improvement for a user with ≥ 50 submissions. Dimension: p95 /profile latency reduction. Scale 0–3. 0 = no change (<5% faster), 1 = 2–3× faster, 2 = 5–10× faster, 3 = >10× faster. Pass threshold ≥ 2. Evidence: Measured response time before/after (e.g., `curl` or Python timing script).

## Task 5: Batch commit/refresh cycles in `apply_inactivity_penalty` and `update_streak`
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: None
- **Description**:
  - In `app/backend/app/services/user_service.py`:
    - `apply_inactivity_penalty()` (lines 9–61): Currently it commits+refreshes in up to 3 branches (first-seen, same-day, penalty-applied case at end). Refactor so:
      - The function only mutates `user` fields and sets `db.add(user)` once.
      - **Exactly one** `db.commit()` and one `db.refresh(user)` at the end of the function.
      - Preserve the exact same penalty logic (3 grace days, 5 pts/day starting day 4, floor at 0).
      - If intermediate logic needs current DB state, read from the ORM objects already in memory; do not commit mid-function.
    - `update_streak()` (lines 64–94): Currently does unconditional `db.commit()` + `db.refresh()` on every call (even same-day login which changes nothing). Refactor so:
      - Track whether any field actually changed (streak or last_login_date).
      - Only `db.commit()` + `db.refresh()` if a change occurred. Same-day no-op calls become in-memory reads only.
  - In `routers/auth.py` login endpoint (lines 78–105): After calling `update_streak`, `record_login`, and `auto_claim_completed_tasks`, the endpoint does yet another commit/refresh. Check whether any of these three helpers already commit; if so, avoid double-commits. Do NOT remove commits that are actually required by auto-claim logic (task completion may depend on persisted state); defer any extra commits to a single batched call if safe.
  - `record_login` and `auto_claim_completed_tasks`: Audit inside `task_service.py` (rest of file, beyond the 200-line section read so far; finish reading). If they commit individually, do not break correctness; but consolidate to a single commit at the caller level where feasible without risking transaction semantics (auto-claim for 14 tasks individually doing commit would be similarly wasteful — batch them in one commit inside the function).
- **Acceptance Criteria Addressed**: AC-4, AC-5, AC-7, NFR-4
- **Test Requirements**:
  - `rule` TR-5.1: During login (`POST /auth/login`), for a same-day returning user (where streak should NOT change and penalty should NOT apply), the total number of SQL `COMMIT` statements drops from ≥ 3 to ≤ 1. Evidence: SQLAlchemy echo log showing COMMIT count for this path.
  - `rule` TR-5.2: Penalty calculation still correct after refactor. Create (or reuse) a test user with `last_seen_at` = 10 days ago; call `/profile` once and confirm `eco_points` decreased by (10−3) × 5 = 35 points (not below 0). Last penalty applied date is updated to today. Evidence: before/after values printed from Python REPL or endpoint.
  - `rule` TR-5.3: Streak still increments correctly for consecutive-day user and resets to 1 for gap. Evidence: Simulated via date mocking or manual REPL updates + endpoint call.

## Task 6: Eliminate redundant front-end profile fetches across login + select-city + profile handoff
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 4 (for best results; logically independent, but depends on backend speed for the full effect)
- **Description**:
  - Add a tiny short-lived profile cache layer in `app/lib/api.ts` (does NOT require any new state library):
    - Store last fetched profile + timestamp in a module-level variable or a localStorage wrapper with a short TTL (30 seconds recommended).
    - Modify the exported `getProfile(userId, localDate?)` function: if `localDate` is not provided AND we have a fresh cache hit (< 30s old) for that userId, return the cached copy; otherwise fetch, update cache, and return.
    - Invalidate cache on `updateProfile` success so Settings account edits reflect immediately.
    - Cache key must include `userId`; do not mix users' data.
  - In `app/login/page.tsx`, function `handleGoogleSuccess` (around lines 138–188 read so far; finish reading the file past the 150-line read in session to confirm):
    - The current code calls: `googleAuth()` → `getProfile()` → redirect logic based on city. Change to:
      - Use the response from `googleAuth()` directly (already has `eco_points`, `streak`, `full_name`) to populate localStorage; if city is needed to decide `/select-city` redirect, ONLY do a lightweight city check rather than full profile serialization. Specifically:
        - If `googleAuth` response includes city in the future, use it; otherwise introduce a small lightweight backend helper or accept one extra getProfile call → this is exactly the case where the new 30s cache will help since `/profile` then redirects to `/select-city` → then to `/profile` again. With 30s cache the subsequent calls are free.
  - In `app/select-city/page.tsx`, the current useEffect calls `getProfile()` just to check city validity (lines 53–74). If the 30s cache is populated from the prior google auth + getProfile call in login page (after 30s cache, subsequent fetches return cached copy within same user navigation), this call becomes a cached no-op. The page can remain working. Keep the redirect to `/profile` correct when city is valid.
  - Result: Across login → select-city → profile mount, only **one** actual HTTP serialization of `/profile/{userId}` occurs (the first call is fresh; others are served from 30s cache). This is acceptable because the 30s window covers only the navigation handoff; any real user action past that will fetch fresh data on demand.
  - In all other authenticated pages (Tasks, Leaderboard, Rewards, Settings, Recycling Map, Scanner) that currently call `getProfile()` on mount, their individual calls still short-circuit via cache for up to 30s when user quickly navigates around, which is also a nice bonus.
- **Acceptance Criteria Addressed**: AC-5, AC-6, AC-7
- **Test Requirements**:
  - `rule` TR-6.1: Google OAuth login flow (simulated by calling `googleAuth` + `getProfile` sequence manually, or real if env configured) results in exactly 1 network request to `/profile/{userId}` across login-page → select-city → profile-mount. Evidence: DevTools Network panel screenshot filtered to `/profile/*`.
  - `rule` TR-6.2: Email login flow: after `router.push("/profile")` exactly 1 `/profile/{userId}` network request is made on Profile mount. If the login response already had user data, the header can pre-populate from localStorage while the cache handles the profile call — either way only one network hit. Evidence: Network panel.
  - `rule` TR-6.3: After `updateProfile` (name change or city change on Settings), the cache invalidates — the next `getProfile()` call makes a real network request and returns the updated name/city on the subsequent call. Evidence: Change name in Settings modal, navigate away and back to Profile, confirm new name is present.
  - `rule` TR-6.4: Unauthenticated access to `/profile` still redirects to `/login`. Evidence: DevTools Network → `307` or client-side redirect to `/login`.
- **Notes**: Do NOT skip the redirect-based auth guard checks. The cache only skips re-fetching within a short window. No tokens, passwords, or IDs are logged.

## Task 7: Integrated smoke test + build diagnostics
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Tasks 1, 2, 3, 4, 5, 6 (all of them)
- **Description**:
  - Run `next build` or the project-equivalent build command (`npm run build` from package.json). Fix any TS/ESLint/import errors.
  - Run backend import/compile smoke check (e.g., import the FastAPI app in Python) to ensure SQLAlchemy changes compile cleanly.
  - Manually exercise the flows:
    - Simulated email login (use a test account if backend running; otherwise unit-level REPL for backend).
    - Registration (end-to-end if possible).
    - Profile load (check each section visually).
    - Leaderboard/Rewards tabs (visually).
    - Settings change theme → confirm card theming updates everywhere.
    - Logout → re-login → confirm consistency.
  - If issues are found in any task, go back and fix them; iterate until diagnostics + visuals pass.
  - Capture approximate durations with timing instrumentation:
    - Login start time (click submit) → Profile page content fully rendered: duration in seconds.
    - Registration start time (click sign up) → Profile page content fully rendered: duration in seconds.
- **Acceptance Criteria Addressed**: AC-1 through AC-7 all verified
- **Test Requirements**:
  - `rule` TR-7.1: `npm run build` (or Next.js equivalent) passes with no TypeScript or ESLint errors. Evidence: Build log.
  - `rule` TR-7.2: Python backend imports cleanly (main.py loads, routes import, no import errors). Evidence: `python -c "import app.main"` or uvicorn startup log (first N lines, no tracebacks).
  - `rule` TR-7.3: Visual spot-check of Profile, Leaderboard, Rewards, Settings, Tasks, Login pages passes manual list from AC-1/AC-2/AC-3 (list documented in completion evidence with pass/fail per item). Evidence: Checklist with screenshots if possible.
  - `rubric` TR-7.4: Overall login/registration speed. Dimension: time from submit → profile interactive. Scale 0–3 (same scale as AC-5; reuse). Pass threshold ≥ 2. Evidence: Manual timer output from two separate runs: one registration, one existing-user login.
