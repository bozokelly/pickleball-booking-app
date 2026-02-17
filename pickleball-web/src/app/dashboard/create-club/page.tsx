'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useClubStore } from '@/stores/clubStore';
import { Button, Input, Card, AddressAutocomplete, MarkdownEditor } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { ArrowLeft } from 'lucide-react';

export default function CreateClubPage() {
  const router = useRouter();
  const { createClub } = useClubStore();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [managerName, setManagerName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [membersOnly, setMembersOnly] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Club name is required', 'error');
      return;
    }
    setLoading(true);
    try {
      const club = await createClub({
        name: name.trim(),
        description: description.trim() || null,
        location: location.trim() || null,
        latitude,
        longitude,
        manager_name: managerName.trim() || null,
        contact_email: contactEmail.trim() || null,
        contact_phone: contactPhone.trim() || null,
        website: website.trim() || null,
        members_only: membersOnly,
      });
      showToast('Club created!', 'success');
      router.push(`/dashboard/club/${club.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create club';
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <h1 className="text-2xl font-bold text-text-primary">Create a Club</h1>
      <p className="text-sm text-text-secondary -mt-4">Start your own pickleball club and invite players to join.</p>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Club Name"
            placeholder="e.g. Sunset Pickleball Club"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <AddressAutocomplete
            label="Location"
            placeholder="e.g. 123 Main St, City"
            value={location}
            onChange={(val, coords) => { setLocation(val); if (coords) { setLatitude(coords.lat); setLongitude(coords.lng); } }}
          />
          <MarkdownEditor
            label="Description"
            placeholder="Tell people about your club..."
            value={description}
            onChange={setDescription}
            rows={4}
          />
          <Input
            label="Club Manager / Contact Person"
            placeholder="e.g. John Smith"
            value={managerName}
            onChange={(e) => setManagerName(e.target.value)}
          />

          {/* Members Only Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-primary">Members Only</p>
              <p className="text-xs text-text-tertiary">Players must be approved members before they can book games</p>
            </div>
            <button
              type="button"
              onClick={() => setMembersOnly(!membersOnly)}
              className={`relative w-11 h-6 rounded-full transition-colors ${membersOnly ? 'bg-primary' : 'bg-border'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${membersOnly ? 'translate-x-5' : ''}`} />
            </button>
          </div>

          <div className="pt-2">
            <h3 className="text-sm font-semibold text-text-secondary mb-3">Contact Information (optional)</h3>
            <div className="space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="club@example.com"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
              <Input
                label="Phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
              />
              <Input
                label="Website"
                type="url"
                placeholder="https://yourclub.com"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>
          </div>

          <Button type="submit" loading={loading} className="w-full">
            Create Club
          </Button>
        </form>
      </Card>
    </div>
  );
}
