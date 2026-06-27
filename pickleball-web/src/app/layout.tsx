import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/ui/Toast';
import DevAuthDebug from '@/components/ui/DevAuthDebug';

export const metadata: Metadata = {
  metadataBase: new URL('https://bookadink.com'),
  title: 'Book A Dink — Premium pickleball, beautifully booked.',
  description: 'Discover clubs, book social games, and meet players at your level — across Perth and beyond.',
  openGraph: {
    title: 'Book A Dink — Premium pickleball, beautifully booked.',
    description: 'Discover clubs, book social games, and meet players at your level.',
    url: 'https://bookadink.com',
    siteName: 'Book A Dink',
    images: [{ url: '/images/logo-wide.png', width: 1536, height: 1024 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Book A Dink',
    description: 'Discover clubs, book social games, and meet players at your level.',
    images: ['/images/logo-wide.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          {process.env.NODE_ENV === 'development' && <DevAuthDebug />}
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
