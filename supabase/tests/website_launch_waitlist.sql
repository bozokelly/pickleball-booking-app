BEGIN;

SELECT plan(13);

SELECT has_table('public', 'website_waitlist_signups', 'waitlist signup table exists');
SELECT has_table('public', 'website_waitlist_rate_limits', 'waitlist rate-limit table exists');
SELECT ok(
  (SELECT relrowsecurity FROM pg_catalog.pg_class WHERE oid = 'public.website_waitlist_signups'::regclass),
  'signup table has RLS enabled'
);
SELECT ok(
  (SELECT relrowsecurity FROM pg_catalog.pg_class WHERE oid = 'public.website_waitlist_rate_limits'::regclass),
  'rate-limit table has RLS enabled'
);

SELECT is(
  public.submit_website_waitlist(
    '  Test   Player  ',
    '  PLAYER@EXAMPLE.COM ',
    'website',
    repeat('a', 64)
  ),
  'joined',
  'first valid signup joins the waitlist'
);

SELECT results_eq(
  $$ SELECT name, email, source, status
     FROM public.website_waitlist_signups
     WHERE email = 'player@example.com' $$,
  $$ VALUES ('Test Player'::text, 'player@example.com'::text, 'website'::text, 'pending'::text) $$,
  'signup data is normalized and initialized safely'
);

SELECT is(
  public.submit_website_waitlist(
    'Another Name',
    'player@example.com',
    'website',
    repeat('b', 64)
  ),
  'already_registered',
  'a duplicate normalized email is idempotent'
);

SELECT is(
  (SELECT count(*)::integer FROM public.website_waitlist_signups WHERE email = 'player@example.com'),
  1,
  'duplicate submission does not create a second row'
);

SELECT throws_ok(
  $$ SELECT public.submit_website_waitlist('', 'valid@example.com', 'website', repeat('c', 64)) $$,
  '22023',
  'invalid_name',
  'database rejects an empty name'
);

SELECT throws_ok(
  $$ SELECT public.submit_website_waitlist('Player', 'invalid', 'website', repeat('c', 64)) $$,
  '22023',
  'invalid_email',
  'database rejects an invalid email'
);

DO $$
BEGIN
  PERFORM public.submit_website_waitlist('One', 'one@example.com', 'website', repeat('d', 64));
  PERFORM public.submit_website_waitlist('Two', 'two@example.com', 'website', repeat('d', 64));
  PERFORM public.submit_website_waitlist('Three', 'three@example.com', 'website', repeat('d', 64));
  PERFORM public.submit_website_waitlist('Four', 'four@example.com', 'website', repeat('d', 64));
  PERFORM public.submit_website_waitlist('Five', 'five@example.com', 'website', repeat('d', 64));
END;
$$;

SELECT is(
  public.submit_website_waitlist('Six', 'six@example.com', 'website', repeat('d', 64)),
  'rate_limited',
  'sixth attempt in fifteen minutes is rate limited'
);

SET LOCAL ROLE anon;

SELECT throws_ok(
  $$ SELECT * FROM public.website_waitlist_signups $$,
  '42501',
  'permission denied for table website_waitlist_signups',
  'anonymous clients cannot read waitlist signups'
);

SELECT throws_ok(
  $$ SELECT public.submit_website_waitlist('Anon', 'anon@example.com', 'website', repeat('e', 64)) $$,
  '42501',
  'permission denied for function submit_website_waitlist',
  'anonymous clients cannot bypass the server endpoint'
);

RESET ROLE;

SELECT * FROM finish();
ROLLBACK;
