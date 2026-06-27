import Image from 'next/image';
import Link from 'next/link';
import type { LegalSection } from './legalContent';
import { lastUpdated } from './legalContent';

type LegalPageProps = {
  title: string;
  intro: string;
  sections: LegalSection[];
};

export function LegalPage({ title, intro, sections }: LegalPageProps) {
  return (
    <main className="min-h-screen bg-[#FBF6EC] text-[#101214]">
      <nav className="sticky top-0 z-10 border-b border-[#101214]/10 bg-[#FBF6EC]/86 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-5xl items-center justify-between px-5 sm:px-8">
          <Link href="/" aria-label="Book a Dink home" className="flex items-center gap-3">
            <Image src="/images/app/bookadink-app-icon.png" alt="" width={44} height={44} className="rounded-xl shadow-sm" />
            <div className="leading-tight">
              <p className="text-base font-semibold">Book a Dink</p>
              <p className="text-xs font-medium text-[#737B86]">Pickleball, organised</p>
            </div>
          </Link>
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-[#101214]/10 bg-white px-4 text-sm font-semibold text-[#101214] shadow-sm transition hover:border-[#101214]/25"
          >
            Back home
          </Link>
        </div>
      </nav>

      <section className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="mb-8 border-b border-[#101214]/10 pb-8 sm:mb-10 sm:pb-10">
          <p className="mb-4 text-sm font-semibold text-[#72B600]">Last updated: {lastUpdated}</p>
          <h1 className="max-w-3xl text-4xl font-semibold leading-[0.98] tracking-normal text-[#101214] sm:text-5xl">
            {title}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-[#5D6470] sm:text-lg sm:leading-8">{intro}</p>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {sections.map((section) => (
            <section
              key={section.title}
              className="rounded-2xl border border-[#101214]/10 bg-white/82 p-5 shadow-sm sm:p-6"
            >
              <h2 className="mb-3 text-lg font-semibold text-[#101214]">{section.title}</h2>
              <div className="space-y-3">
                {section.body.map((paragraph) => (
                  <p key={paragraph} className="text-sm leading-6 text-[#5D6470] sm:text-base sm:leading-7">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}
