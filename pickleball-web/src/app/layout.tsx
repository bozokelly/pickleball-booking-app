import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/ui/Toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Book a Dink — Pickleball Booking Made Easy',
  description: 'Find games, join clubs, and connect with players in your area. The easiest way to organize and book pickleball.',
  openGraph: {
    title: 'Book a Dink — Pickleball Booking Made Easy',
    description: 'Find games, join clubs, and connect with players in your area.',
    url: 'https://bookadink.com',
    siteName: 'Book a Dink',
    images: [{ url: '/images/logo-wide.png', width: 1536, height: 1024 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Book a Dink',
    description: 'Find games, join clubs, and connect with players in your area.',
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
