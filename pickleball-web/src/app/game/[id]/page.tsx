import Link from 'next/link';
import type { Metadata } from 'next';
import { cache } from 'react';
import { createPublicServerSupabase } from '@/lib/supabaseServerPublic';
import { getAppleItunesMeta, getAppStoreUrl, getSiteOrigin } from '@/lib/publicAppMeta';

type GamePublicData = {
  id: string;
  title: string;
  date_time: string;
  game_format: string;
  max_spots: number;
  club_id: string;
};

type ClubNameData = {
  id: string;
  name: string;
  image_url: string | null;
};

const fetchGame = cache(async (rawId: string): Promise<GamePublicData | null> => {
  const id = rawId.toLowerCase();
  const supabase = createPublicServerSupabase();
  const { data } = await supabase
    .from('games')
    .select('id, title, date_time, game_format, max_spots, club_id')
    .eq('id', id)
    .maybeSingle();
  return (data as GamePublicData | null) || null;
});

const fetchClubById = cache(async (clubId: string): Promise<ClubNameData | null> => {
  const supabase = createPublicServerSupabase();
  const { data } = await supabase
    .from('clubs')
    .select('id, name, image_url')
    .eq('id', clubId.toLowerCase())
    .maybeSingle();
  return (data as ClubNameData | null) || null;
});

const fetchConfirmedSpots = cache(async (gameId: string): Promise<number | null> => {
  const supabase = createPublicServerSupabase();
  const { count } = await supabase
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('game_id', gameId.toLowerCase())
    .eq('status', 'confirmed');
  return typeof count === 'number' ? count : null;
});

function formatGameDate(dateTime: string): string {
  const dt = new Date(dateTime);
  return new Intl.DateTimeFormat('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(dt);
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const normalizedId = id.toLowerCase();
  const game = await fetchGame(normalizedId);
  const club = game ? await fetchClubById(game.club_id) : null;

  const siteOrigin = getSiteOrigin();
  const shareUrl = `${siteOrigin}/game/${normalizedId}`;
  const title = game && club
    ? `${game.title} at ${club.name} — Book a Dink`
    : game
      ? `${game.title} — Book a Dink`
      : 'Game — Book a Dink';
  const description = game
    ? `${game.game_format.replace(/_/g, ' ')} game on ${formatGameDate(game.date_time)}${club ? ` at ${club.name}` : ''}.`
    : 'View this game on Book a Dink.';
  const imageUrl = club?.image_url || `${siteOrigin}/images/logo-wide.png`;
  const appleItunesMeta = getAppleItunesMeta(shareUrl);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: shareUrl,
      type: 'website',
      images: [{ url: imageUrl }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
    ...(appleItunesMeta ? { other: { 'apple-itunes-app': appleItunesMeta } } : {}),
  };
}

export default async function GameFallbackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const normalizedId = id.toLowerCase();

  const game = await fetchGame(normalizedId);
  const [club, confirmedSpots] = await Promise.all([
    game ? fetchClubById(game.club_id) : Promise.resolve(null),
    game ? fetchConfirmedSpots(game.id) : Promise.resolve(null),
  ]);

  const spotsRemaining = game && typeof confirmedSpots === 'number'
    ? Math.max(0, game.max_spots - confirmedSpots)
    : null;

  const siteOrigin = getSiteOrigin();
  const shareUrl = `${siteOrigin}/game/${normalizedId}`;
  const appStoreUrl = getAppStoreUrl();
  const continueOnWebUrl = `/dashboard/game/${normalizedId}`;

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-10 sm:py-14">
        <div className="rounded-2xl border border-border bg-white p-6 sm:p-8 shadow-sm">
          <p className="text-xs font-semibold tracking-wide uppercase text-primary mb-3">Book a Dink</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">
            {game?.title || 'Game not found'}
          </h1>

          {game ? (
            <>
              <div className="mt-4 space-y-2 text-sm text-text-secondary">
                <p>Date: {formatGameDate(game.date_time)}</p>
                <p>Format: {game.game_format.replace(/_/g, ' ')}</p>
                {club?.name && <p>Club: {club.name}</p>}
                {typeof spotsRemaining === 'number' && <p>Spots remaining: {spotsRemaining}</p>}
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <a
                  href={shareUrl}
                  className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors"
                >
                  Open in App
                </a>
                <a
                  href={appStoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-5 py-3 rounded-xl border border-primary/20 text-primary font-semibold hover:bg-primary/5 transition-colors"
                >
                  Download Book a Dink
                </a>
              </div>

              <div className="mt-4">
                <Link href={continueOnWebUrl} className="text-sm text-text-secondary hover:text-primary underline underline-offset-4">
                  Continue on Web
                </Link>
              </div>
            </>
          ) : (
            <div className="mt-6">
              <p className="text-sm text-text-secondary">This game link may be invalid or no longer available.</p>
              <Link href="/dashboard/games" className="inline-block mt-4 text-sm text-primary hover:underline">
                Browse Games on Web
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
