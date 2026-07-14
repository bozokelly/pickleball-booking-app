'use client';

import Image from 'next/image';
import { useCallback, useEffect } from 'react';

type VerifiedLandingClientProps = {
  appStoreUrl: string;
  googlePlayUrl: string;
};

const APP_CALLBACK = 'bookadink://auth-callback';

function currentAppCallback(): string {
  // Keep the Supabase callback payload intact for the app. It is never logged,
  // rendered, persisted, or included in analytics.
  return `${APP_CALLBACK}${window.location.search}${window.location.hash}`;
}

export default function VerifiedLandingClient({
  appStoreUrl,
  googlePlayUrl,
}: VerifiedLandingClientProps) {
  const openApp = useCallback(() => {
    window.location.assign(currentAppCallback());
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const hasError = params.has('error') || fragment.has('error');
    if (!hasError) {
      const timer = window.setTimeout(openApp, 250);
      return () => window.clearTimeout(timer);
    }
  }, [openApp]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f5f7] px-5 py-10">
      <section className="w-full max-w-md rounded-[32px] border border-black/5 bg-white px-7 py-9 text-center shadow-[0_24px_70px_rgba(15,23,42,0.12)] sm:px-10">
        <Image
          src="/images/app/bookadink-app-icon-192.png"
          alt="Book a Dink"
          width={96}
          height={96}
          className="mx-auto h-24 w-24 rounded-[24px] shadow-lg"
        />

        <div className="mx-auto mt-7 flex h-12 w-12 items-center justify-center rounded-full bg-[#b8ff34] text-2xl font-bold text-black">
          ✓
        </div>

        <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-[#111214]">
          Email verified
        </h1>
        <p className="mt-3 text-base leading-7 text-[#62656b]">
          Your Book a Dink account is ready. We’ll open the app now.
        </p>

        <button
          type="button"
          onClick={openApp}
          className="mt-7 w-full rounded-2xl bg-[#b8ff34] px-5 py-4 text-base font-bold text-black transition hover:bg-[#a7ed28] focus:outline-none focus:ring-4 focus:ring-[#b8ff34]/35"
        >
          Open App
        </button>

        <p className="mt-7 text-sm font-medium text-[#858990]">Don’t have the app yet?</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <a
            href={appStoreUrl}
            className="rounded-xl border border-[#dedfe3] px-3 py-3 text-sm font-semibold text-[#202226] transition hover:bg-[#f7f7f8]"
          >
            App Store
          </a>
          <a
            href={googlePlayUrl}
            className="rounded-xl border border-[#dedfe3] px-3 py-3 text-sm font-semibold text-[#202226] transition hover:bg-[#f7f7f8]"
          >
            Google Play
          </a>
        </div>
      </section>
    </main>
  );
}
