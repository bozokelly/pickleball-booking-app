'use client';

import Link from 'next/link';
import { useRef, useState, useSyncExternalStore } from 'react';
import { Cookie, X } from 'lucide-react';

const STORAGE_KEY = 'bookadink_cookie_preferences_v1';
const PREFERENCES_VERSION = 1;

type ConsentDecision = 'all' | 'essential';

type StoredPreferences = {
  version: typeof PREFERENCES_VERSION;
  decision: ConsentDecision;
  analytics: false;
  marketing: false;
  savedAt: string;
};

export function CookiePreferences() {
  const storedValue = useSyncExternalStore(
    subscribeToPreferenceChanges,
    readStoredValue,
    () => undefined,
  );
  const [ephemeralPreferences, setEphemeralPreferences] = useState<StoredPreferences | null>(null);
  const storedPreferences = storedValue ? parseStoredPreferences(storedValue) : null;
  const preferences = storedPreferences ?? ephemeralPreferences;
  const ready = storedValue !== undefined;
  const dialogRef = useRef<HTMLDialogElement>(null);

  if (!ready) return null;

  function save(decision: ConsentDecision) {
    const nextPreferences: StoredPreferences = {
      version: PREFERENCES_VERSION,
      decision,
      analytics: false,
      marketing: false,
      savedAt: new Date().toISOString(),
    };

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextPreferences));
      window.dispatchEvent(new Event('bookadink-cookie-preferences'));
    } catch {
      // A privacy mode may block storage. Keep the decision for this page view.
    }

    setEphemeralPreferences(nextPreferences);
    dialogRef.current?.close();
  }

  function openPreferences() {
    if (!dialogRef.current?.open) dialogRef.current?.showModal();
  }

  return (
    <>
      {!preferences ? (
        <section
          aria-label="Cookie notice"
          className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-4xl rounded-[1.5rem] border border-[#101214]/12 bg-white/96 p-5 text-[#101214] shadow-[0_24px_90px_rgba(16,18,20,0.24)] backdrop-blur-xl sm:inset-x-5 sm:p-6"
        >
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="flex gap-4">
              <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#C8FF2E] sm:flex">
                <Cookie className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-base font-semibold">Your cookie choices</h2>
                <p className="mt-1 text-sm leading-6 text-[#5D6470]">
                  BookaDink currently uses only essential sign-in cookies. We do not load analytics or marketing cookies. Your choice is saved in this browser.{' '}
                  <Link href="/privacy" className="font-semibold text-[#3F6500] underline underline-offset-2">Learn more</Link>
                </p>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-3 lg:w-[30rem]">
              <button type="button" onClick={() => save('all')} className="h-11 rounded-xl bg-[#101214] px-4 text-sm font-semibold text-white transition hover:bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#101214]">
                Accept all
              </button>
              <button type="button" onClick={() => save('essential')} className="h-11 rounded-xl border border-[#101214]/15 bg-white px-4 text-sm font-semibold transition hover:border-[#101214]/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#101214]">
                Reject non-essential
              </button>
              <button type="button" onClick={openPreferences} className="h-11 rounded-xl px-4 text-sm font-semibold text-[#4D5662] transition hover:bg-[#F4F0E8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#101214]">
                Manage preferences
              </button>
            </div>
          </div>
        </section>
      ) : (
        <button
          type="button"
          onClick={openPreferences}
          className="fixed bottom-3 left-3 z-[90] inline-flex h-10 items-center gap-2 rounded-xl border border-[#101214]/12 bg-white/94 px-3 text-xs font-semibold text-[#4D5662] shadow-md backdrop-blur transition hover:text-[#101214] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#101214] sm:bottom-5 sm:left-5"
        >
          <Cookie className="h-4 w-4" aria-hidden="true" />
          Cookie preferences
        </button>
      )}

      <dialog
        ref={dialogRef}
        aria-labelledby="cookie-preferences-title"
        className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-[1.75rem] border border-[#101214]/12 bg-white p-0 text-[#101214] shadow-[0_32px_120px_rgba(0,0,0,0.35)] backdrop:bg-[#101214]/55 backdrop:backdrop-blur-sm"
      >
        <div className="p-6 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5D7E24]">Privacy controls</p>
              <h2 id="cookie-preferences-title" className="mt-2 text-2xl font-semibold">Cookie preferences</h2>
            </div>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label="Close cookie preferences"
              className="flex h-10 w-10 items-center justify-center rounded-xl text-[#5D6470] transition hover:bg-[#F4F0E8] hover:text-[#101214] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#101214]"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <p className="mt-4 text-sm leading-6 text-[#5D6470]">
            There are no optional analytics or marketing cookies to enable today. If that changes, BookaDink will ask again before loading them.
          </p>

          <div className="mt-6 space-y-3">
            <PreferenceRow title="Essential" description="Used for secure sign-in sessions and core website operation." active status="Always active" />
            <PreferenceRow title="Analytics" description="BookaDink does not currently use analytics cookies." active={false} status="Not in use" />
            <PreferenceRow title="Marketing" description="BookaDink does not currently use advertising or marketing cookies." active={false} status="Not in use" />
          </div>

          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            <button type="button" onClick={() => save('all')} className="h-11 rounded-xl bg-[#101214] px-4 text-sm font-semibold text-white transition hover:bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#101214]">
              Accept all
            </button>
            <button type="button" onClick={() => save('essential')} className="h-11 rounded-xl border border-[#101214]/15 bg-white px-4 text-sm font-semibold transition hover:border-[#101214]/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#101214]">
              Reject non-essential
            </button>
          </div>
          <p className="mt-4 text-center text-xs leading-5 text-[#727985]">
            Both choices currently keep optional categories off.{' '}
            <Link href="/privacy" onClick={() => dialogRef.current?.close()} className="font-semibold text-[#3F6500] underline underline-offset-2">Privacy Policy</Link>
          </p>
        </div>
      </dialog>
    </>
  );
}

function PreferenceRow({
  title,
  description,
  active,
  status,
}: {
  title: string;
  description: string;
  active: boolean;
  status: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-[#101214]/10 bg-[#FBF6EC] p-4">
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="mt-1 text-xs leading-5 text-[#66707C]">{description}</p>
      </div>
      <span className={`mt-0.5 shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${active ? 'bg-[#C8FF2E] text-[#263600]' : 'bg-[#E9E5DC] text-[#66707C]'}`}>
        {status}
      </span>
    </div>
  );
}

function subscribeToPreferenceChanges(onStoreChange: () => void) {
  function handleStorage(event: StorageEvent) {
    if (event.key === STORAGE_KEY) onStoreChange();
  }

  window.addEventListener('storage', handleStorage);
  window.addEventListener('bookadink-cookie-preferences', onStoreChange);
  return () => {
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener('bookadink-cookie-preferences', onStoreChange);
  };
}

function readStoredValue(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function parseStoredPreferences(raw: string): StoredPreferences | null {
  try {
    const parsed = JSON.parse(raw) as Partial<StoredPreferences>;

    if (
      parsed.version !== PREFERENCES_VERSION
      || (parsed.decision !== 'all' && parsed.decision !== 'essential')
      || parsed.analytics !== false
      || parsed.marketing !== false
      || typeof parsed.savedAt !== 'string'
    ) {
      return null;
    }

    return parsed as StoredPreferences;
  } catch {
    return null;
  }
}
