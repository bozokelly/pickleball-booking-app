# Pickleball Web App: Implementation Notes + Regression Checklist

Last updated: March 10, 2026 (AWST, UTC+08:00)  
Scope: `pickleball-web` only (Next.js web app)

## 1) Purpose of this document

This file is the practical operating guide for the website:

- What is currently implemented.
- What changed most recently.
- What must be regression-tested before deploy.
- What is known to be incomplete or risky.

This is intentionally detailed so engineering/product can use one source of truth for release readiness.

---

## 2) System overview

## 2.1 Tech stack

- Framework: Next.js 16 (App Router)
- Language: TypeScript
- UI: React 19 + Tailwind CSS 4 + custom design system components
- State: Zustand stores by domain
- Backend: Supabase (Auth, PostgreSQL, Storage, Realtime, Functions)
- Payments: Stripe.js + Supabase Edge Function (`create-payment-intent`)
- Mapping: Google Maps JS API
- News: RSS ingestion via `rss-parser` in `/api/news`

## 2.2 Key directories

- App routes: `pickleball-web/src/app`
- Shared state stores: `pickleball-web/src/stores`
- UI components: `pickleball-web/src/components`
- Domain utilities: `pickleball-web/src/utils`
- Supabase browser client: `pickleball-web/src/lib/supabase.ts`
- Auth middleware: `pickleball-web/src/middleware.ts`

## 2.3 Required environment variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- `IOS_APP_IDS` (comma-separated Apple App IDs like `TEAMID.com.bookadink.app`)
- `ANDROID_APP_PACKAGE`
- `ANDROID_SHA256_CERT_FINGERPRINTS` (comma-separated)

If missing:

- Auth and data calls fail or use placeholder config.
- Payments cannot initialize.
- Maps/autocomplete fail to load.
- Universal/App Link association endpoints return empty mappings.

## 2.4 Route map (high level)

Public:

- `/` (landing)

Auth:

- `/login`
- `/signup`
- `/forgot-password`
- `/reset-password`
- `/auth/callback` (Supabase auth code exchange)

Authenticated dashboard:

- `/dashboard` (home/feed + widgets)
- `/dashboard/games` (find club/game)
- `/dashboard/calendar`
- `/dashboard/profile`
- `/dashboard/notifications`
- `/dashboard/news`
- `/dashboard/support`
- `/dashboard/settings`
- `/dashboard/onboarding`
- `/dashboard/create-club`
- `/dashboard/club/[id]`
- `/dashboard/game/[id]`

Admin:

- `/dashboard/admin`
- `/dashboard/admin/create-club`
- `/dashboard/admin/edit-club/[id]`
- `/dashboard/admin/create-game`
- `/dashboard/admin/edit-game/[id]`
- `/dashboard/admin/schedule-game/[id]`
- `/dashboard/admin/club/[id]/members`
- `/dashboard/admin/club/[id]/messages`

API:

- `/api/news`

---

## 3) Latest implementation timeline (recent)

Most recent commits affecting `pickleball-web`:

1. `7ec2bfb` (2026-03-10): Web: make logos link home and remove club banner feature
2. `bcd74a6` (2026-02-27): Fix auth init race condition using `getSession()`
3. `14d1f36` (2026-02-27): Fix infinite spinner on refresh
4. `3147f45` (2026-02-27): Landing sections, dashboard empty state, SEO metadata, PWA manifest
5. `4ee86c2` + `a4ac304` + `f3a3056` + `9cd6735` + `203d53d` (2026-02-26): branding/logo overhaul
6. `9ea2862` (2026-02-26): design system refresh
7. `d13ffdd` + `3f8aadb` (2026-02-21): onboarding and profile completeness workflow

### 3.1 What changed in the latest web release (2026-03-10)

- Logo click behavior:
  - Clicking brand/logo now routes users to `/` from landing/auth/dashboard logo surfaces.
- Club banner feature removal on website:
  - Removed banner/hero rendering from club detail page.
  - Removed club image thumbnail usage in profile club list.
  - Removed web-side `uploadClubImage` helper.
  - Removed club image field from feed club joins/types where not needed.

Note:

- Club `image_url` still exists in shared DB schema/type surface for compatibility, but website UI no longer uses it as a club banner.

---

## 4) Current feature inventory

## 4.1 Authentication and session

Implemented:

- Email/password sign up and sign in.
- Email confirmation resend flow.
- Forgot/reset password pages.
- Session handling with Supabase SSR + middleware route protection.
- Redirect behavior:
  - Unauthed users redirected from `/dashboard*` to `/login`.
  - Authed users redirected from `/login`/`/signup` to `/dashboard`.

Risk areas:

- Any future auth flow change must be validated in both middleware and client store init paths.

## 4.2 Onboarding and profile completeness

Implemented:

- Forced onboarding when required fields are missing (`phone`, `date_of_birth`).
- Onboarding captures:
  - phone
  - DOB
  - optional DUPR
  - optional emergency contact
  - email notification consent
- Profile page supports:
  - avatar upload
  - personal info updates
  - DUPR updates
  - emergency contact updates
  - password change

## 4.3 Clubs and memberships

Implemented:

- Club discovery/listing with map + search.
- Club detail:
  - membership status badges
  - join/leave flows
  - member list
  - upcoming games
  - contact form to admins
  - club feed
- Members-only club gate is respected via backend booking constraints.

Implemented for admins:

- Create/edit/delete club.
- Members-only toggle.
- Manage member requests (approve/reject/remove).
- Promote/demote admins.
- View member emergency contact information.
- Club message inbox and replies.

## 4.4 Games, booking, waitlist, and payments

Implemented:

- Upcoming games list with filters and club grouping.
- Game detail page:
  - booking / waitlist actions
  - cancellation flow
  - DUPR required flow and rating confirmation
  - admin booking other players into game/waitlist
  - promoted waitlist payment-required banner with deadline message
  - ICS download integration

Payments:

- Booking payment invokes `create-payment-intent` via Supabase function.
- Stripe confirmation currently uses tokenized card path (`tok_visa`) placeholder style in utility.

## 4.5 Feed and social interactions

Implemented:

- Home feed with realtime refresh on insert/delete.
- Post composer with club targeting.
- Reactions.
- Threaded comments/replies.
- Image gallery rendering.
- URL preview support with cached previews.

## 4.6 Notifications

Implemented:

- Notification list with type icons.
- Mark single/all read.
- Deep links by notification type to game/club/admin pages.
- Badge counts in dashboard nav.

## 4.7 News and support

Implemented:

- News page backed by `/api/news` RSS fetch + 15-minute in-memory cache.
- Support page cards and contact email.

## 4.8 PWA and metadata

Implemented:

- App metadata in layout.
- Manifest and icons present.

---

## 5) Known gaps / technical debt

1. Test automation:
   - No dedicated web test suite currently defined in `pickleball-web/package.json`.
   - Regression is primarily manual at this time.

2. Lint/tooling consistency:
   - Root workspace and web workspace eslint version mismatch can break local lint execution unless dependencies are aligned.

3. Settings page toggles:
   - Notification/appearance/region toggles are currently mostly UI placeholders (not all persist).

4. Stripe payment UX:
   - Current utility path is not a full production Elements checkout experience.

5. SSR/cache behavior for `/api/news`:
   - In-memory cache resets on process restart and does not share cache across server instances.

6. Club banner deprecation:
   - Website UI no longer uses club banners; schema may still carry `image_url` for cross-platform compatibility.

---

## 6) Regression checklist (manual)

Use this checklist before each production release.

Legend:

- `[ ]` pending
- `[x]` passed
- `[n/a]` not applicable for this release

## 6.1 Preconditions

- [ ] Supabase project reachable and migrations up to date.
- [ ] Required env vars set for web runtime.
- [ ] Stripe test keys configured.
- [ ] Google Maps key valid and unrestricted for expected domains.
- [ ] Seed data exists: clubs, games, members, at least one paid game, one members-only club.
- [ ] Have at least 3 test users:
  - regular player
  - club admin
  - non-member player

## 6.2 Auth + onboarding

- [ ] New sign-up works and lands in email confirmation state.
- [ ] Resend confirmation cooldown/flow works.
- [ ] Sign-in works for confirmed account.
- [ ] Unauthenticated access to `/dashboard` redirects to `/login`.
- [ ] Authenticated access to `/login` redirects to `/dashboard`.
- [ ] Incomplete profile is forced to `/dashboard/onboarding`.
- [ ] Completing onboarding allows access to main dashboard.
- [ ] Forgot/reset password flow completes successfully.

## 6.3 Navigation + brand behavior

- [ ] Clicking landing logo goes to `/`.
- [ ] Clicking auth page logo goes to `/`.
- [ ] Clicking dashboard sidebar logo goes to `/`.
- [ ] Desktop sidebar navigation routes correctly.
- [ ] Mobile bottom nav routes correctly.

## 6.4 Club discovery and club detail

- [ ] Search by club name returns expected clubs.
- [ ] Search by location returns expected clubs.
- [ ] Club map renders markers without JS errors.
- [ ] Club detail loads name, membership badges, metadata.
- [ ] Club detail does not display a banner/hero image.
- [ ] Directions link opens Google Maps with expected destination.

## 6.5 Membership lifecycle

- [ ] Non-member can request membership.
- [ ] Pending status shown correctly.
- [ ] Admin can approve request.
- [ ] Approved member status appears without stale UI state.
- [ ] Member can leave club.
- [ ] Members-only club blocks non-members from booking (backend-enforced).

## 6.6 Games and booking flow

- [ ] Upcoming games load on `/dashboard/games`.
- [ ] Club expandable game previews render correctly.
- [ ] Game detail page loads with all metadata and badges.
- [ ] Free game booking succeeds and status updates.
- [ ] Booking cancel flow succeeds and removes confirmation.
- [ ] Waitlist join flow succeeds when game is full.
- [ ] Waitlist position displays correctly.

## 6.7 Paid game flow

- [ ] Paid game booking opens payment flow.
- [ ] Payment success marks booking paid and confirmed.
- [ ] Payment cancel/failure properly rolls back booking if expected.
- [ ] Promoted waitlist payment-required banner appears only in applicable cases.
- [ ] Deadline messaging for promoted players is accurate.

## 6.8 DUPR requirements

- [ ] DUPR-required game blocks booking until confirmation.
- [ ] User can add/update DUPR rating in modal flow.
- [ ] DUPR validation range (0 to 8) enforced.
- [ ] Booking continues only after DUPR confirmation.

## 6.9 Admin club operations

- [ ] Admin panel loads managed clubs and upcoming games.
- [ ] Create club works with optional contact fields.
- [ ] Edit club persists changes.
- [ ] Delete club requires confirmation and deletes successfully.
- [ ] Members-only toggle changes behavior as expected.

## 6.10 Admin game operations

- [ ] Create single game works.
- [ ] Create recurring games works with intended count and schedule.
- [ ] Edit game persists updates.
- [ ] Delete game removes game and related bookings.
- [ ] Admin can add/book players into a game.
- [ ] Schedule generation page renders allocation output without crash.

## 6.11 Messaging and feed

- [ ] Club message form sends message to admins.
- [ ] Admin club messages list loads and unread styles appear.
- [ ] Admin can reply and message threads render correctly.
- [ ] Admin can delete message thread.
- [ ] Feed post creation works.
- [ ] Feed image upload works.
- [ ] Reactions toggle correctly and counts update.
- [ ] Comments and replies add/remove correctly.
- [ ] Realtime new post appears without full refresh.

## 6.12 Notifications

- [ ] Notification list loads latest notifications.
- [ ] Mark single notification read works.
- [ ] Mark all read works and count resets.
- [ ] Clicking notification deep links to correct destination.
- [ ] Badge counters on nav update appropriately.

## 6.13 Profile + account settings

- [ ] Avatar upload succeeds and persists on reload.
- [ ] Personal profile fields save and persist.
- [ ] Emergency contact fields save and are visible to admins in member view.
- [ ] Password change flow works.
- [ ] Delete account flow executes and signs user out.
- [ ] Settings page renders without runtime errors.

## 6.14 Calendar and exports

- [ ] Calendar page loads booked dates.
- [ ] Selecting date filters bookings correctly.
- [ ] Badge status (confirmed/waitlisted) is correct.
- [ ] ICS download works and file contains expected event metadata.

## 6.15 News and support

- [ ] `/api/news` returns data (or graceful fallback on failure).
- [ ] News page renders cards and opens external links.
- [ ] Support links (email) open correct target.

## 6.16 Responsive + accessibility baseline

- [ ] Core pages usable on mobile width (`~375px`).
- [ ] No horizontal overflow in dashboard layouts.
- [ ] Keyboard navigation works for primary actions.
- [ ] Focus states visible on interactive controls.
- [ ] Color contrast acceptable for key text and action surfaces.

## 6.17 Universal/App Links

- [ ] `/.well-known/apple-app-site-association` returns valid JSON (200, no redirect).
- [ ] `/.well-known/assetlinks.json` returns valid JSON (200, no redirect).
- [ ] iOS Associated Domains config includes `applinks:bookadink.com`.
- [ ] Android intent filter + SHA256 fingerprints match production signing certs.
- [ ] Shared `https://bookadink.com/...` links open app when installed and web when not installed.

## 6.18 Security / authorization checks

- [ ] Non-admin user cannot access admin-only actions in UI.
- [ ] Server-side/RLS denies unauthorized data updates.
- [ ] Users only see data they are expected to access.
- [ ] Membership-gated features remain inaccessible to non-members.

---

## 7) Release gate recommendation

A release should be blocked if any of the following fail:

1. Auth/session redirects broken.
2. Booking/cancellation flow broken.
3. Paid game payment workflow broken.
4. Membership approval flow broken.
5. Admin create/edit/delete flows broken.
6. Notifications deep-link routing broken.

---

## 8) Suggested operating cadence

For every planned release:

1. Run quick smoke tests (sections 6.2 to 6.7 and 6.10 to 6.12).
2. Run full checklist for major releases.
3. Record outcomes and blockers under a dated section in this file.

Template:

```md
### Regression Run - YYYY-MM-DD
- Environment:
- Build SHA:
- Tester:
- Pass summary:
- Failing checks:
- Decision: Ship / No ship
```

---

## 9) Next-step improvement candidates (for planning)

1. Add web E2E smoke tests (Playwright) for auth, booking, and admin critical paths.
2. Stabilize lint/typecheck tooling so CI checks run consistently inside `pickleball-web`.
3. Replace placeholder Stripe payment confirmation with production-grade Elements flow.
4. Add persistent feature flags/settings backend for settings toggles.
5. Add release checklist automation in CI (at minimum route smoke and API health).
