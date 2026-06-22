import type { Metadata } from 'next';
import { LegalPage } from '../LegalPage';
import { termsSections } from '../legalContent';

export const metadata: Metadata = {
  title: 'Terms of Service - Book a Dink',
  description: 'Terms of Service for Book a Dink players, clubs, bookings, payments, memberships, and community features.',
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      intro="These terms explain how players, clubs, and organisers may use Bookadink during launch and beta."
      sections={termsSections}
    />
  );
}
