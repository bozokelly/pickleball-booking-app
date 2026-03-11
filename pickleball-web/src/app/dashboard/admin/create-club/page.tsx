import ClubCreateForm from '@/components/club/ClubCreateForm';

export default function CreateClubPage() {
  return (
    <ClubCreateForm
      title="Create Club"
      successRoute="admin"
      contactOptional={false}
    />
  );
}
