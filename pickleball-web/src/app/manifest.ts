import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Book a Dink',
    short_name: 'Book a Dink',
    start_url: '/',
    display: 'standalone',
    background_color: '#EEF2F8',
    theme_color: '#4F6FA3',
    icons: [
      {
        src: '/images/logo.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/images/logo.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
