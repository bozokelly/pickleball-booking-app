import { createHmac } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { isStagingHost } from '@/lib/stagingEnvironment';
import { validateWaitlistSubmission } from '@/lib/waitlistValidation';

export const runtime = 'nodejs';

const MAX_REQUEST_BYTES = 4_096;

export async function POST(request: Request) {
  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().includes('application/json')) {
    return json({ message: 'Send this form as JSON.' }, 415);
  }

  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).byteLength > MAX_REQUEST_BYTES) {
    return json({ message: 'That submission is too large.' }, 413);
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return json({ message: 'Check the form and try again.' }, 400);
  }

  if (isHoneypotFilled(body)) {
    // Give automated form fillers a non-enumerating success response without
    // writing their payload or consuming database resources.
    return json({ status: 'joined' }, 200);
  }

  const validation = validateWaitlistSubmission(body);
  if (!validation.valid) {
    return json(
      { message: validation.message, field: validation.field },
      400,
    );
  }

  const admin = createSupabaseAdminClient();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  if (!admin || !serviceRoleKey) {
    console.error('[waitlist] Supabase server configuration is unavailable.');
    return json({ message: 'We could not save your place right now. Please try again soon.' }, 503);
  }

  const host = request.headers.get('host');
  const requestFingerprint = createRequestFingerprint(request, serviceRoleKey);
  const { data, error } = await admin.rpc('submit_website_waitlist', {
    p_name: validation.value.name,
    p_email: validation.value.email,
    p_source: isStagingHost(host) ? 'staging_website' : 'website',
    p_request_fingerprint: requestFingerprint,
  });

  if (error) {
    console.error('[waitlist] Submission failed.', {
      code: error.code,
      details: error.details,
    });
    const isValidationError = error.code === '22023';
    return json(
      { message: isValidationError ? 'Check the form and try again.' : 'We could not save your place right now. Please try again soon.' },
      isValidationError ? 400 : 503,
    );
  }

  if (data === 'rate_limited') {
    return json(
      { message: 'Too many attempts. Please wait 15 minutes and try again.' },
      429,
      { 'Retry-After': '900' },
    );
  }

  if (data === 'joined' || data === 'already_registered') {
    return json({ status: data }, 200);
  }

  console.error('[waitlist] Unexpected database response.', { response: data });
  return json({ message: 'We could not save your place right now. Please try again soon.' }, 503);
}

function createRequestFingerprint(request: Request, secret: string): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const address = forwardedFor?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')?.trim()
    || 'unknown';
  const boundedAddress = address.slice(0, 128);

  return createHmac('sha256', secret)
    .update(`bookadink-waitlist-rate-limit:v1:${boundedAddress}`)
    .digest('hex');
}

function isHoneypotFilled(body: unknown): boolean {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return false;
  const value = (body as Record<string, unknown>).website;
  return typeof value === 'string' && value.trim().length > 0;
}

function json(
  body: Record<string, string>,
  status: number,
  headers?: HeadersInit,
) {
  return NextResponse.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      ...headers,
    },
  });
}
