import { redirect } from 'next/navigation';

export default async function LegacyGameLinkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/dashboard/game/${id}`);
}
