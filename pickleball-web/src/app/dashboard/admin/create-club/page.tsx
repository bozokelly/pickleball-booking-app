'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useClubStore } from '@/stores/clubStore';
import { Button, Input, Card, AddressAutocomplete } from '@/components/ui';
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
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Club name is required', 'error');
      return;
    }
    setLoading(true);
    try {
      await createClub({
        name: name.trim(),
        description: description.trim() || null,
        location: location.trim() || null,
        latitude,
        longitude,
        contact_email: contactEmail.trim() || null,
        contact_phone: contactPhone.trim() || null,
        website: website.trim() || null,
      });
      showToast('Club created!', 'success');
      router.push('/dashboard/admin');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : (err as any)?.message || 'Failed to create club';
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
      <h1 className="text-2xl font-bold text-text-primary">Create Club</h1>

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
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Description</label>
            <textarea
              placeholder="Tell people about your club..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
            />
          </div>
          {/* Contact Information */}
          <div className="pt-2">
            <h3 className="text-sm font-semibold text-text-secondary mb-3">Contact Information</h3>
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
