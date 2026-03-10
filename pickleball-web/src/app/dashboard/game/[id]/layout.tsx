import type { Metadata } from 'next';
import { getAppleItunesMeta, getSiteOrigin } from '@/lib/publicAppMeta';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const normalizedId = id.toLowerCase();
  const appArgumentUrl = `${getSiteOrigin()}/game/${normalizedId}`;
  const appleItunesMeta = getAppleItunesMeta(appArgumentUrl);

  if (!appleItunesMeta) return {};
  return { other: { 'apple-itunes-app': appleItunesMeta } };
}

export default function DashboardGameLayout({ children }: { children: React.ReactNode }) {
  return children;
}
