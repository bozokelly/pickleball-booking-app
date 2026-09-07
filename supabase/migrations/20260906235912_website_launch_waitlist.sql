-- Public website launch waitlist.
-- Writes are only accepted through the server-side RPC below. The browser has
-- no direct table access, and the RPC is executable only by service_role.

CREATE TABLE public.website_waitlist_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source TEXT NOT NULL DEFAULT 'website',
  status TEXT NOT NULL DEFAULT 'pending',
  CONSTRAINT website_waitlist_name_valid
    CHECK (name = btrim(name) AND char_length(name) BETWEEN 1 AND 80),
  CONSTRAINT website_waitlist_email_normalized
    CHECK (email = lower(btrim(email)) AND char_length(email) BETWEEN 3 AND 254),
  CONSTRAINT website_waitlist_source_valid
    CHECK (source ~ '^[a-z0-9_-]{1,40}$'),
  CONSTRAINT website_waitlist_status_valid
    CHECK (status IN ('pending', 'notified', 'unsubscribed')),
  CONSTRAINT website_waitlist_email_unique UNIQUE (email)
);

CREATE INDEX website_waitlist_signups_created_at_idx
  ON public.website_waitlist_signups (created_at DESC);

ALTER TABLE public.website_waitlist_signups ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.website_waitlist_signups FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.website_waitlist_signups TO service_role;

-- One keyed, non-reversible fingerprint per recent client is retained only for
-- abuse prevention. Old rows are pruned during subsequent submissions.
CREATE TABLE public.website_waitlist_rate_limits (
  request_fingerprint TEXT PRIMARY KEY,
  window_started_at TIMESTAMPTZ NOT NULL,
  attempt_count INTEGER NOT NULL CHECK (attempt_count BETWEEN 1 AND 5),
  updated_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT website_waitlist_fingerprint_valid
    CHECK (request_fingerprint ~ '^[0-9a-f]{64}$')
);

CREATE INDEX website_waitlist_rate_limits_updated_at_idx
  ON public.website_waitlist_rate_limits (updated_at);

ALTER TABLE public.website_waitlist_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.website_waitlist_rate_limits FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.website_waitlist_rate_limits TO service_role;

CREATE OR REPLACE FUNCTION public.submit_website_waitlist(
  p_name TEXT,
  p_email TEXT,
  p_source TEXT,
  p_request_fingerprint TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_name TEXT := regexp_replace(btrim(p_name), '[[:space:]]+', ' ', 'g');
  v_email TEXT := lower(btrim(p_email));
  v_now TIMESTAMPTZ := clock_timestamp();
  v_limit public.website_waitlist_rate_limits%ROWTYPE;
  v_inserted_count INTEGER;
BEGIN
  IF v_name IS NULL
    OR char_length(v_name) NOT BETWEEN 1 AND 80
    OR v_name ~ '[[:cntrl:]]'
  THEN
    RAISE EXCEPTION 'invalid_name' USING ERRCODE = '22023';
  END IF;

  IF v_email IS NULL
    OR char_length(v_email) NOT BETWEEN 3 AND 254
    OR v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  THEN
    RAISE EXCEPTION 'invalid_email' USING ERRCODE = '22023';
  END IF;

  IF p_source IS NULL OR p_source !~ '^[a-z0-9_-]{1,40}$' THEN
    RAISE EXCEPTION 'invalid_source' USING ERRCODE = '22023';
  END IF;

  IF p_request_fingerprint IS NULL OR p_request_fingerprint !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'invalid_request_fingerprint' USING ERRCODE = '22023';
  END IF;

  -- Serialize rate-limit updates per fingerprint so concurrent retries cannot
  -- race past the five-attempt window.
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_request_fingerprint, 0)
  );

  DELETE FROM public.website_waitlist_rate_limits
  WHERE updated_at < v_now - INTERVAL '24 hours';

  SELECT *
  INTO v_limit
  FROM public.website_waitlist_rate_limits
  WHERE request_fingerprint = p_request_fingerprint
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.website_waitlist_rate_limits (
      request_fingerprint,
      window_started_at,
      attempt_count,
      updated_at
    ) VALUES (
      p_request_fingerprint,
      v_now,
      1,
      v_now
    );
  ELSIF v_limit.window_started_at <= v_now - INTERVAL '15 minutes' THEN
    UPDATE public.website_waitlist_rate_limits
    SET window_started_at = v_now,
        attempt_count = 1,
        updated_at = v_now
    WHERE request_fingerprint = p_request_fingerprint;
  ELSIF v_limit.attempt_count >= 5 THEN
    RETURN 'rate_limited';
  ELSE
    UPDATE public.website_waitlist_rate_limits
    SET attempt_count = attempt_count + 1,
        updated_at = v_now
    WHERE request_fingerprint = p_request_fingerprint;
  END IF;

  INSERT INTO public.website_waitlist_signups (name, email, source)
  VALUES (v_name, v_email, p_source)
  ON CONFLICT (email) DO NOTHING;

  GET DIAGNOSTICS v_inserted_count = ROW_COUNT;

  IF v_inserted_count = 0 THEN
    RETURN 'already_registered';
  END IF;

  RETURN 'joined';
END;
$$;

REVOKE ALL ON FUNCTION public.submit_website_waitlist(TEXT, TEXT, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_website_waitlist(TEXT, TEXT, TEXT, TEXT)
  TO service_role;

COMMENT ON TABLE public.website_waitlist_signups IS
  'Server-managed launch notification signups. Not readable or writable by public clients.';
COMMENT ON FUNCTION public.submit_website_waitlist(TEXT, TEXT, TEXT, TEXT) IS
  'Validates, rate-limits, normalizes, and idempotently records a website launch waitlist signup.';
