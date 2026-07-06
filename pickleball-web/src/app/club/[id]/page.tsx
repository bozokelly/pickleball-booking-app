import Link from 'next/link';
import type { Metadata } from 'next';
import { cache } from 'react';
import { createPublicServerSupabase } from '@/lib/supabaseServerPublic';
import { getAppleItunesMeta, getAppStoreUrl, getSiteOrigin } from '@/lib/publicAppMeta';

type ClubPublicData = {
  id: string;
  name: string;
  description: string | null;
  locationLabel: string | null;
  image_url: string | null;
};

type ClubVenueData = {
  venue_name: string | null;
  street_address: string | null;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  country: string | null;
};

const fetchClub = cache(async (rawId: string): Promise<ClubPublicData | null> => {
  const id = rawId.toLowerCase();
  const supabase = createPublicServerSupabase();
  const [{ data: club }, { data: venue }] = await Promise.all([
    supabase
      .from('clubs')
      .select('id, name, description, image_url, venue_name, street_address, suburb, state, postcode, country')
      .eq('id', id)
      .maybeSingle(),
    supabase
      .from('club_venues')
      .select('venue_name, street_address, suburb, state, postcode, country')
      .eq('club_id', id)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  if (!club) return null;

  const clubRow = club as RowWithLocation;
  return {
    id: String(clubRow.id),
    name: String(clubRow.name || 'Club'),
    description: typeof clubRow.description === 'string' ? clubRow.description : null,
    image_url: typeof clubRow.image_url === 'string' ? clubRow.image_url : null,
    locationLabel: formatLocationLabel((venue as ClubVenueData | null) || clubRow),
  };
});

const fetchMemberCount = cache(async (rawId: string): Promise<number | null> => {
  const id = rawId.toLowerCase();
  const supabase = createPublicServerSupabase();
  const { data } = await supabase.rpc('public_club_member_count', { p_club_id: id });
  return typeof data === 'number' ? data : null;
});

type RowWithLocation = ClubVenueData & {
  id?: unknown;
  name?: unknown;
  description?: unknown;
  image_url?: unknown;
};

function formatLocationLabel(row: ClubVenueData | RowWithLocation | null): string | null {
  if (!row) return null;
  const lineOne = [row.venue_name, row.street_address].filter(Boolean).join(', ');
  const lineTwo = [row.suburb, row.state, row.postcode].filter(Boolean).join(' ');
  const label = [lineOne, lineTwo || row.country].filter(Boolean).join(' · ');
  return label || null;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const normalizedId = id.toLowerCase();
  const club = await fetchClub(normalizedId);

  const siteOrigin = getSiteOrigin();
  const shareUrl = `${siteOrigin}/club/${normalizedId}`;
  const title = club?.name ? `${club.name} — Book a Dink` : 'Club — Book a Dink';
  const description = club?.description || `View this club on Book a Dink.`;
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

export default async function ClubFallbackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const normalizedId = id.toLowerCase();

  const [club, memberCount] = await Promise.all([
    fetchClub(normalizedId),
    fetchMemberCount(normalizedId),
  ]);

  const siteOrigin = getSiteOrigin();
  const shareUrl = `${siteOrigin}/club/${normalizedId}`;
  const appStoreUrl = getAppStoreUrl();

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-10 sm:py-14">
        <div className="rounded-2xl border border-border bg-white p-6 sm:p-8 shadow-sm">
          <p className="text-xs font-semibold tracking-wide uppercase text-primary mb-3">Bookadink</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">
            {club?.name || 'Club not found'}
          </h1>

          {club ? (
            <>
              <div className="mt-4 space-y-2 text-sm text-text-secondary">
                {club.locationLabel && <p>Location: {club.locationLabel}</p>}
                {typeof memberCount === 'number' && <p>Members: {memberCount}</p>}
                {club.description && <p>{club.description}</p>}
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

              <div className="mt-4 text-sm text-text-secondary">
                Web club access has moved to the mobile app.{' '}
                <Link href="/" className="font-semibold text-primary hover:underline">
                  Learn about Bookadink
                </Link>
              </div>
            </>
          ) : (
            <div className="mt-6">
              <p className="text-sm text-text-secondary">This club link may be invalid or no longer available.</p>
              <Link href="/" className="inline-block mt-4 text-sm text-primary hover:underline">
                Learn about Bookadink
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
