import type { Metadata } from 'next';
import { getAppleItunesMeta, getClubUniversalLink } from '@/lib/publicAppMeta';
import { generateMetadata as generateClubMetadata } from '../../club/[id]/page';

type PageProps = {
  params: Promise<{ id: string }>;
};

export { default } from '../../club/[id]/page';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const [{ id }, metadata] = await Promise.all([
    params,
    generateClubMetadata({ params }),
  ]);
  const canonicalUrl = getClubUniversalLink(id.toLowerCase());
  const appleItunesMeta = getAppleItunesMeta(canonicalUrl);
  let other = metadata.other;

  if (appleItunesMeta) {
    const appMetadata: Record<string, string | number | (string | number)[]> = {};
    for (const [key, value] of Object.entries(metadata.other ?? {})) {
      if (value !== undefined) appMetadata[key] = value;
    }
    appMetadata['apple-itunes-app'] = appleItunesMeta;
    other = appMetadata;
  }

  return {
    ...metadata,
    alternates: {
      ...metadata.alternates,
      canonical: canonicalUrl,
    },
    openGraph: {
      ...metadata.openGraph,
      url: canonicalUrl,
    },
    other,
  };
}
