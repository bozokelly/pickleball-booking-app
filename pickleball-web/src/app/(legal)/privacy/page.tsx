import type { Metadata } from 'next';
import { LegalPage } from '../LegalPage';
import { privacySections } from '../legalContent';

export const metadata: Metadata = {
  title: 'Privacy Policy - Book a Dink',
  description: 'Privacy Policy for Book a Dink account, booking, payment, club, notification, location, and community data.',
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro="This policy explains what Bookadink collects, how it is used, and the choices available to players and clubs."
      sections={privacySections}
    />
  );
}
