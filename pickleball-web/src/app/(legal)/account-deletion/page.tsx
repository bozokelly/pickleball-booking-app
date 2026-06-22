import type { Metadata } from 'next';
import { LegalPage } from '../LegalPage';
import { accountDeletionSections } from '../legalContent';

export const metadata: Metadata = {
  title: 'Account Deletion - Book a Dink',
  description: 'How to request deletion of a Book a Dink account and associated personal information.',
};

export default function AccountDeletionPage() {
  return (
    <LegalPage
      title="Account Deletion"
      intro="Use this page to request deletion of your Bookadink account and associated personal information."
      sections={accountDeletionSections}
    />
  );
}
