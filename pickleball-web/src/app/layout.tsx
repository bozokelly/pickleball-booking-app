import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/ui/Toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://bookadink.com'),
  title: 'Bookadink — Pickleball bookings without the admin headache',
  description: 'Bookadink helps pickleball players find games and helps clubs manage sessions, waitlists, payments, memberships, chat, and reminders.',
  openGraph: {
    title: 'Bookadink — Pickleball bookings without the admin headache',
    description: 'Mobile-first pickleball booking software for players, clubs, and organisers.',
    url: 'https://bookadink.com',
    siteName: 'Bookadink',
    images: [{ url: '/images/logo-wide.png', width: 1536, height: 1024 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bookadink',
    description: 'Pickleball bookings without the admin headache.',
    images: ['/images/logo-wide.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
