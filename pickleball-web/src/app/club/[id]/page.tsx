import { redirect } from 'next/navigation';

export default async function LegacyClubLinkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/dashboard/club/${id}`);
}
