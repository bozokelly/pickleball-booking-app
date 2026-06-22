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
    <main className="min-h-screen">
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none select-none z-0" aria-hidden="true">
        <Image
          src="/images/logo-wide.png"
          alt=""
          width={1100}
          height={733}
          className="w-[90vw] max-w-[1100px] h-auto opacity-[0.05]"
        />
      </div>

      <nav className="relative border-b border-border/50 bg-white/75 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/images/logo.png" alt="Book a Dink" width={40} height={40} className="object-contain" />
            <span className="text-sm font-semibold text-text-primary">Book a Dink</span>
          </Link>
          <Link href="/" className="text-sm font-semibold text-primary hover:text-primary-dark transition-colors">
            Back home
          </Link>
        </div>
      </nav>

      <section className="relative max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="mb-8 sm:mb-10">
          <p className="text-sm font-semibold text-primary mb-3">Last updated: {lastUpdated}</p>
          <h1 className="text-3xl sm:text-5xl font-bold text-text-primary tracking-tight">{title}</h1>
          <p className="mt-4 text-base sm:text-lg text-text-secondary max-w-2xl leading-relaxed">{intro}</p>
        </div>

        <div className="space-y-4">
          {sections.map((section) => (
            <section
              key={section.title}
              className="bg-white/90 border border-border/50 rounded-2xl p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)]"
            >
              <h2 className="text-lg font-semibold text-text-primary mb-3">{section.title}</h2>
              <div className="space-y-3">
                {section.body.map((paragraph) => (
                  <p key={paragraph} className="text-sm sm:text-base text-text-secondary leading-relaxed">
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
