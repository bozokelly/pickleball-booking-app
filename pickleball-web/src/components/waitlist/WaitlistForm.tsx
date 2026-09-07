'use client';

import { useState, type FormEvent } from 'react';
import { CheckCircle2, LoaderCircle } from 'lucide-react';
import Link from 'next/link';
import { validateWaitlistSubmission } from '@/lib/waitlistValidation';

type FormStatus = 'idle' | 'submitting' | 'joined' | 'already_registered';

type FieldErrors = {
  name?: string;
  email?: string;
  form?: string;
};

export function WaitlistForm() {
  const [status, setStatus] = useState<FormStatus>('idle');
  const [errors, setErrors] = useState<FieldErrors>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === 'submitting') return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    const validation = validateWaitlistSubmission({
      name: formData.get('name'),
      email: formData.get('email'),
    });

    if (!validation.valid) {
      setErrors({ [validation.field]: validation.message });
      const invalidField = form.elements.namedItem(validation.field);
      if (invalidField instanceof HTMLElement) invalidField.focus();
      return;
    }

    setErrors({});
    setStatus('submitting');

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...validation.value,
          website: formData.get('website'),
        }),
      });
      const result = await response.json() as {
        status?: 'joined' | 'already_registered';
        field?: 'name' | 'email';
        message?: string;
      };

      if (response.ok && result.status) {
        setStatus(result.status);
        return;
      }

      if (result.field) {
        setErrors({ [result.field]: result.message ?? 'Check this field and try again.' });
      } else {
        setErrors({ form: result.message ?? 'Something went wrong. Please try again.' });
      }
      setStatus('idle');
    } catch {
      setErrors({ form: 'We could not reach BookaDink. Check your connection and try again.' });
      setStatus('idle');
    }
  }

  if (status === 'joined' || status === 'already_registered') {
    const isDuplicate = status === 'already_registered';
    return (
      <div className="rounded-[1.75rem] border border-[#101214]/10 bg-white p-6 shadow-[0_24px_80px_rgba(16,18,20,0.16)] sm:p-8" role="status" aria-live="polite">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#C8FF2E]">
          <CheckCircle2 className="h-7 w-7 text-[#101214]" aria-hidden="true" />
        </div>
        <h2 className="mt-6 text-3xl font-semibold tracking-tight text-[#101214]">
          {isDuplicate ? 'You’re already on the list.' : 'You’re on the list.'}
        </h2>
        <p className="mt-3 text-base leading-7 text-[#5D6470]">
          {isDuplicate
            ? 'No need to sign up again — we’ll let you know when BookaDink is ready to download.'
            : 'Thanks for joining us. We’ll email you when BookaDink is available to download.'}
        </p>
        <Link
          href="/"
          className="mt-7 inline-flex h-12 items-center justify-center rounded-2xl bg-[#101214] px-5 text-sm font-semibold text-white transition hover:bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#101214]"
        >
          Explore BookaDink
        </Link>
      </div>
    );
  }

  return (
    <form
      className="rounded-[1.75rem] border border-[#101214]/10 bg-white p-6 shadow-[0_24px_80px_rgba(16,18,20,0.16)] sm:p-8"
      onSubmit={handleSubmit}
      noValidate
    >
      <div>
        <label htmlFor="waitlist-name" className="text-sm font-semibold text-[#101214]">Name</label>
        <input
          id="waitlist-name"
          name="name"
          type="text"
          autoComplete="name"
          maxLength={80}
          required
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? 'waitlist-name-error' : undefined}
          className="mt-2 h-13 w-full rounded-2xl border border-[#101214]/15 bg-[#FBF6EC] px-4 text-base text-[#101214] outline-none transition placeholder:text-[#8A929C] focus:border-[#72B600] focus:ring-4 focus:ring-[#C8FF2E]/25"
          placeholder="Your name"
        />
        {errors.name && <p id="waitlist-name-error" className="mt-2 text-sm font-medium text-[#B42318]">{errors.name}</p>}
      </div>

      <div className="mt-5">
        <label htmlFor="waitlist-email" className="text-sm font-semibold text-[#101214]">Email</label>
        <input
          id="waitlist-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          maxLength={254}
          required
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? 'waitlist-email-error' : 'waitlist-email-help'}
          className="mt-2 h-13 w-full rounded-2xl border border-[#101214]/15 bg-[#FBF6EC] px-4 text-base text-[#101214] outline-none transition placeholder:text-[#8A929C] focus:border-[#72B600] focus:ring-4 focus:ring-[#C8FF2E]/25"
          placeholder="you@example.com"
        />
        {errors.email ? (
          <p id="waitlist-email-error" className="mt-2 text-sm font-medium text-[#B42318]">{errors.email}</p>
        ) : (
          <p id="waitlist-email-help" className="mt-2 text-xs leading-5 text-[#727985]">Launch updates only. No marketing trackers.</p>
        )}
      </div>

      <div className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
        <label htmlFor="waitlist-website">Website</label>
        <input id="waitlist-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {errors.form && (
        <p className="mt-5 rounded-xl bg-[#FFF0ED] px-4 py-3 text-sm font-medium leading-6 text-[#9E2A1B]" role="alert">
          {errors.form}
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="mt-6 inline-flex h-13 w-full items-center justify-center rounded-2xl bg-[#101214] px-6 text-base font-semibold text-white shadow-[0_16px_36px_rgba(16,18,20,0.2)] transition hover:-translate-y-0.5 hover:bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#101214] disabled:cursor-not-allowed disabled:opacity-65 disabled:hover:translate-y-0"
      >
        {status === 'submitting' ? (
          <>
            <LoaderCircle className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
            Joining…
          </>
        ) : 'Join the waitlist'}
      </button>

      <p className="mt-4 text-center text-xs leading-5 text-[#727985]">
        By joining, you agree that we may use your details to notify you about launch availability. See our{' '}
        <Link href="/privacy" className="font-semibold text-[#3F6500] underline underline-offset-2">Privacy Policy</Link>.
      </p>
    </form>
  );
}
