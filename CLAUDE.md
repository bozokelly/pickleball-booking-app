# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Tech Stack

- **Frontend:** React Native + Expo SDK 52 with Expo Router (file-based routing)
- **Backend:** Supabase (PostgreSQL, Auth, Edge Functions, Row Level Security, Realtime, Storage)
- **Payments:** Stripe (via `@stripe/stripe-react-native` + Supabase Edge Functions)
- **State Management:** Zustand (one store per domain: auth, games, clubs, membership, notifications)
- **Language:** TypeScript (strict mode)
- **UI:** Custom Apple-inspired component library (no external UI framework)
- **Calendar:** react-native-calendars (in-app) + expo-calendar (native sync)
- **Notifications:** expo-notifications (push + local scheduled reminders)
- **Auth tokens:** Stored via expo-secure-store

## Common Commands

```bash
npx expo start                  # Start dev server (Expo Go or dev client)
npx expo run:ios                # Build and run on iOS simulator
npx expo run:android            # Build and run on Android emulator
npm run lint                    # ESLint across src/
npm run typecheck               # TypeScript type checking (no emit)
npm run test                    # Jest test suite
npm run test -- --testPathPattern=calendar  # Run a single test file
supabase start                  # Start local Supabase (Docker required)
supabase db push                # Push migrations to remote Supabase
supabase db reset               # Reset local database and re-run migrations
supabase gen types typescript --local > src/types/database.ts  # Regenerate types
supabase functions deploy promote-waitlist       # Deploy waitlist push notification function
supabase functions deploy create-payment-intent  # Deploy Stripe payment function
supabase functions deploy stripe-webhook         # Deploy Stripe webhook handler
```

## Architecture

### Routing (Expo Router — file-based)

```
src/app/
  _layout.tsx              → Root layout: auth gating, splash screen, StripeProvider, push setup
  (auth)/                  → Auth group (unauthenticated)
    login.tsx              → Email/password login
    signup.tsx             → Registration with email confirmation
    forgot-password.tsx    → Password reset via email
  (tabs)/                  → Main tab group (authenticated)
    _layout.tsx            → Tab bar: Home, Calendar, Profile
    index.tsx              → Home feed with search bar, skill/format filters, upcoming games
    calendar.tsx           → Calendar view of booked games (react-native-calendars)
    profile.tsx            → User profile with avatar upload, DUPR rating, native DOB picker
  game/[id]/
    index.tsx              → Game detail: info, participant list, book/waitlist/pay, cancel, calendar sync
    chat.tsx               → Real-time game chat (Supabase Realtime)
  admin/                   → Admin screens (visible to club admins)
    index.tsx              → List of managed clubs, links to create club/game
    create-club.tsx        → Club creation form
    create-game.tsx        → Game creation with native date/time pickers, skill level, format, fee
    club/[id]/members.tsx  → Member management: approve/reject join requests
```

### State Stores (Zustand)

- `authStore` — Session, profile, sign in/up/out, profile updates
- `gameStore` — Upcoming games list, user bookings, book/cancel via Supabase RPCs
- `clubStore` — Club list, admin clubs, create/update clubs, admin management
- `membershipStore` — Club membership requests, approvals, status checking
- `notificationStore` — In-app notification list, read/unread state

### Database Schema (PostgreSQL via Supabase)

**Tables:** `profiles`, `clubs`, `club_admins`, `club_members`, `games`, `bookings`, `game_messages`, `notifications`

Two migrations:
- `001_initial_schema.sql` — Core tables, booking RPCs, RLS policies
- `002_additional_features.sql` — Club membership, game chat, payment fields, reminder fields, members-only clubs

Booking logic is handled atomically in PostgreSQL functions (`book_game`, `cancel_booking`) to prevent race conditions. `book_game` also enforces club membership for members-only clubs. When a confirmed player cancels, the first waitlisted player is automatically promoted and a `waitlist_promoted` notification is inserted.

**Supabase Edge Functions:**
- `promote-waitlist` — Sends Expo push notification when waitlist_promoted notification is inserted
- `create-payment-intent` — Creates Stripe PaymentIntent for paid game bookings
- `stripe-webhook` — Handles payment_intent.succeeded to mark bookings as paid

**Supabase Storage buckets:**
- `avatars` — User profile pictures (public, organized by user ID)
- `club-images` — Club photos (public, organized by club ID)

**Supabase Realtime:** Enabled on `game_messages` table for live chat.

### Design System

`src/constants/theme.ts` contains all colors, typography, spacing, border radius, and shadows following iOS Human Interface Guidelines. Skill levels and game formats have dedicated color and label mappings.

Reusable components in `src/components/ui/`: Button (5 variants), Input (with icon, password toggle, error state), Card (pressable), Badge, DateTimePicker (native iOS modal spinner / Android default picker).

### Key Patterns

- **Atomic booking:** The `book_game` RPC locks the game row, checks capacity and membership, then confirms or waitlists — no client-side race conditions.
- **Waitlist promotion:** Handled server-side in `cancel_booking` RPC. Inserts a notification row, which triggers the Edge Function for push delivery.
- **Payment gating:** When booking a paid game, the app calls `create-payment-intent` edge function, shows Stripe Payment Sheet, and the `stripe-webhook` marks the booking as paid on success. If payment is cancelled, the booking is rolled back.
- **Club membership:** Clubs can be set to `members_only`. Users request to join, admins approve/reject. The `book_game` RPC enforces membership checks.
- **Real-time chat:** `game_messages` table uses Supabase Realtime (postgres_changes). Only confirmed/waitlisted players can read and send messages (enforced by RLS).
- **Game reminders:** Local push notifications scheduled 1 hour before game time via `expo-notifications`. Notification IDs stored on bookings for cancellation.
- **Auth gating:** Root `_layout.tsx` checks session state and redirects between `(auth)` and `(tabs)` groups.
- **Calendar integration:** `src/utils/calendar.ts` uses expo-calendar to add game events to the device's default calendar with a 1-hour reminder.
- **Image uploads:** `src/utils/imageUpload.ts` uses expo-image-picker + Supabase Storage with base64 encoding.
- **Search & filters:** Client-side filtering on home screen by search text (title, club, location), skill level, and game format.

## Environment Setup

1. Copy `.env.example` to `.env` and fill in:
   - Supabase URL + anon key
   - Stripe publishable key
   - Expo project ID (for push notifications)
2. `npm install`
3. `supabase start` (for local dev) or point to hosted Supabase project
4. `supabase db push` to run both migrations
5. Create storage buckets: `supabase storage create avatars --public` and `supabase storage create club-images --public`
6. Deploy edge functions: `supabase functions deploy`
7. Set up Stripe webhook pointing to the `stripe-webhook` edge function URL
8. `npx expo start`

## Stripe Setup

1. Create a Stripe account and get test keys
2. Add `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` to `.env`
3. Add `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` as Supabase Edge Function secrets:
   ```bash
   supabase secrets set STRIPE_SECRET_KEY=sk_test_xxx
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx
   ```
4. Configure Stripe webhook in dashboard to point to `https://your-project.supabase.co/functions/v1/stripe-webhook` for `payment_intent.succeeded` events
