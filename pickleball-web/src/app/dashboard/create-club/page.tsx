import ClubCreateForm from '@/components/club/ClubCreateForm';

export default function CreateClubPage() {
  return (
    <ClubCreateForm
      title="Create a Club"
      subtitle="Start your own pickleball club and invite players to join."
      successRoute="club"
      contactOptional
    />
  );
}
