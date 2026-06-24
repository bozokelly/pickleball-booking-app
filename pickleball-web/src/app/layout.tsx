import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/ui/Toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://bookadink.com'),
  title: 'Book a Dink - Pickleball bookings, waitlists, chat and payments',
  description: 'Book a Dink promotes the mobile app for pickleball players and clubs, with bookings, waitlists, payments, memberships, chat, reminders, and results.',
  openGraph: {
    title: 'Book a Dink - Pickleball bookings, waitlists, chat and payments',
    description: 'A mobile-first pickleball app for players, clubs, and organisers.',
    url: 'https://bookadink.com',
    siteName: 'Book a Dink',
    images: [{ url: '/images/app/bookadink-app-icon.png', width: 1024, height: 1024 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Book a Dink',
    description: 'Pickleball bookings, waitlists, chat and payments, all in one app.',
    images: ['/images/app/bookadink-app-icon.png'],
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
