import type { Metadata } from 'next';
import { getAppStoreUrl, getGooglePlayUrl } from '@/lib/publicAppMeta';
import VerifiedLandingClient from './VerifiedLandingClient';

export const metadata: Metadata = {
  title: 'Email verified | Book a Dink',
  description: 'Your Book a Dink email address has been verified. Open the app to continue.',
  robots: { index: false, follow: false },
};

export default function VerifiedPage() {
  return (
    <VerifiedLandingClient
      appStoreUrl={getAppStoreUrl()}
      googlePlayUrl={getGooglePlayUrl()}
    />
  );
}
