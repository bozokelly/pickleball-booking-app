import type { Metadata } from 'next';
import Image from 'next/image';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { CheckCircle2, LockKeyhole } from 'lucide-react';
import { canRenderStagingOnlyRoute } from '@/lib/stagingEnvironment';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Billing settings updated - BookaDink Staging',
  description: 'Return page for the BookaDink staging billing portal.',
  robots: { index: false, follow: false },
};

export default async function StagingBillingReturnPage() {
  const requestHeaders = await headers();
  const allowed = canRenderStagingOnlyRoute({
    host: requestHeaders.get('host'),
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
  });

  if (!allowed) notFound();

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#101214] px-5 py-12 text-white">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute left-[-8rem] top-[-8rem] h-96 w-96 rounded-full bg-[#C8FF2E]/18 blur-3xl" />
        <div className="absolute bottom-[-10rem] right-[-8rem] h-[30rem] w-[30rem] rounded-full bg-[#FF6A3D]/12 blur-3xl" />
      </div>

      <section className="relative w-full max-w-xl rounded-[2rem] border border-white/12 bg-white/[0.07] p-7 text-center shadow-[0_32px_110px_rgba(0,0,0,0.4)] backdrop-blur-xl sm:p-10">
        <Image
          src="/images/app/bookadink-app-icon.png"
          alt="BookaDink"
          width={64}
          height={64}
          className="mx-auto rounded-2xl shadow-lg"
          priority
        />
        <p className="mt-5 text-sm font-semibold uppercase tracking-[0.2em] text-[#C8FF2E]">BookaDink Staging</p>
        <div className="mx-auto mt-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#C8FF2E]">
          <CheckCircle2 className="h-8 w-8 text-[#101214]" aria-hidden="true" />
        </div>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">You’re all set.</h1>
        <p className="mx-auto mt-4 max-w-md text-base leading-7 text-white/68 sm:text-lg">
          Your staging billing portal visit is complete. You can close this tab and return to the BookaDink Staging app.
        </p>
        <div className="mt-8 flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/18 px-4 py-3 text-sm text-white/58">
          <LockKeyhole className="h-4 w-4 text-[#C8FF2E]" aria-hidden="true" />
          No payment details are displayed or processed on this page.
        </div>
      </section>
    </main>
  );
}
