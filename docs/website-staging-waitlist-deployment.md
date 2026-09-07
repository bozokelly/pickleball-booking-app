# Website staging, cookie preferences, and launch waitlist

## Routes

- Production waitlist: `https://www.bookadink.com/waitlist`
- Staging billing return: `https://staging.bookadink.com/billing/return`
- Production billing return is intentionally unavailable and returns `404`.

The billing return page is informational only. It does not read Stripe query parameters, fetch billing records, or process payments.

## Supabase deployment

The migration `20260906235912_website_launch_waitlist.sql` must be applied to every Supabase environment that receives website waitlist submissions.

For each environment, link and verify the intended project before pushing:

```bash
supabase link --project-ref <staging-project-ref>
supabase migration list
supabase db push

supabase link --project-ref <production-project-ref>
supabase migration list
supabase db push
```

Do not reuse the production project for the staging website. The API route uses the environment's server-only `SUPABASE_SERVICE_ROLE_KEY`; it must never be exposed with a `NEXT_PUBLIC_` prefix.

Required website environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)

## Vercel staging host

`staging.bookadink.com` did not resolve during the implementation audit. To make the staging return URL live without mixing production and staging data:

1. Create a dedicated Vercel project for the `pickleball-web` directory, or a Vercel custom staging environment backed by a stable staging branch.
2. Set its three Supabase environment variables to the staging Supabase project values.
3. Add `staging.bookadink.com` in that staging project's **Settings → Domains**.
4. At the DNS provider for `bookadink.com`, add the exact CNAME or A record Vercel displays for `staging.bookadink.com`. Remove any conflicting record first.
5. Wait for Vercel to show **Valid Configuration** and issue the TLS certificate.
6. Set the Stripe Billing Portal return URL in the Stripe **test/sandbox** configuration to `https://staging.bookadink.com/billing/return`.
7. Verify the URL over HTTPS. Verify `https://www.bookadink.com/billing/return` returns `404`.

The hostname check is server-side and permits only the canonical staging host, local development, and Vercel preview hosts. Do not point the staging hostname at a deployment configured with production Supabase or Stripe credentials.

## Cookie behavior

The audit found Supabase authentication cookies used for secure signed-in sessions. No analytics, advertising, or marketing scripts were present. The consent UI therefore:

- identifies sign-in cookies as essential;
- keeps analytics and marketing categories off and states that they are not in use;
- stores the user's decision in browser local storage;
- can be reopened from the persistent **Cookie preferences** control;
- deliberately requires a new implementation and consent-version change before any optional tracker can load.

## Verification

```bash
cd pickleball-web
npm ci
npm run check

cd ..
supabase start
supabase test db supabase/tests/website_launch_waitlist.sql
```

Before release, submit one new mixed-case email and then submit it again. The first response must be `joined`, the second `already_registered`, and the database must contain one lower-case email row. Confirm that anonymous Data API requests cannot select either waitlist table or execute `submit_website_waitlist`.
