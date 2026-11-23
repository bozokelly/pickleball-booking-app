import type { Metadata } from 'next';
import Image from 'next/image';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { CheckCircle2, LockKeyhole } from 'lucide-react';
import {
  PRODUCTION_BILLING_RETURN_BODY,
  PRODUCTION_BILLING_RETURN_HEADING,
} from '@/lib/billingReturn';
import { billingReturnAudience, type BillingReturnAudience } from '@/lib/stagingEnvironment';

export const dynamic = 'force-dynamic';

const STAGING_METADATA: Metadata = {
  title: { absolute: 'Billing settings updated - BookaDink Staging' },
  description: 'Return page for the BookaDink staging billing portal.',
  robots: { index: false, follow: false },
};

const PRODUCTION_METADATA: Metadata = {
  title: { absolute: PRODUCTION_BILLING_RETURN_HEADING },
  description: 'Close this window and return to Book a Dink.',
  robots: { index: false, follow: false },
  openGraph: {
    title: PRODUCTION_BILLING_RETURN_HEADING,
    description: 'Close this window and return to Book a Dink.',
    url: 'https://www.bookadink.com/billing/return',
    siteName: 'Book a Dink',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: PRODUCTION_BILLING_RETURN_HEADING,
    description: 'Close this window and return to Book a Dink.',
  },
};

async function audienceFromRequest(): Promise<BillingReturnAudience | null> {
  const requestHeaders = await headers();
  return billingReturnAudience({
    host: requestHeaders.get('host'),
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
  });
}

export async function generateMetadata(): Promise<Metadata> {
  const audience = await audienceFromRequest();
  if (audience === 'production') return PRODUCTION_METADATA;
  if (audience === 'staging') return STAGING_METADATA;
  notFound();
}

export default async function BillingReturnPage() {
  const audience = await audienceFromRequest();
  if (!audience) notFound();

  const production = audience === 'production';

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#101214] px-5 py-12 text-white">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute left-[-8rem] top-[-8rem] h-96 w-96 rounded-full bg-[#C8FF2E]/18 blur-3xl" />
        <div className="absolute bottom-[-10rem] right-[-8rem] h-[30rem] w-[30rem] rounded-full bg-[#FF6A3D]/12 blur-3xl" />
      </div>

      <section className="relative w-full max-w-xl rounded-[2rem] border border-white/12 bg-white/[0.07] p-7 text-center shadow-[0_32px_110px_rgba(0,0,0,0.4)] backdrop-blur-xl sm:p-10">
        <Image
          src="/images/app/bookadink-app-icon.png"
          alt={production ? 'Book a Dink' : 'BookaDink'}
          width={64}
          height={64}
          className="mx-auto rounded-2xl shadow-lg"
          priority
        />
        <p className="mt-5 text-sm font-semibold uppercase tracking-[0.2em] text-[#C8FF2E]">
          {production ? 'Book a Dink' : 'BookaDink Staging'}
        </p>
        {production ? null : (
          <div className="mx-auto mt-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#C8FF2E]">
            <CheckCircle2 className="h-8 w-8 text-[#101214]" aria-hidden="true" />
          </div>
        )}
        <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">
          {production ? PRODUCTION_BILLING_RETURN_HEADING : 'You’re all set.'}
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base leading-7 text-white/68 sm:text-lg">
          {production
            ? PRODUCTION_BILLING_RETURN_BODY
            : 'Your staging billing portal visit is complete. You can close this tab and return to the BookaDink Staging app.'}
        </p>
        {production ? null : (
          <div className="mt-8 flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/18 px-4 py-3 text-sm text-white/58">
            <LockKeyhole className="h-4 w-4 text-[#C8FF2E]" aria-hidden="true" />
            No payment details are displayed or processed on this page.
          </div>
        )}
      </section>
    </main>
  );
}
