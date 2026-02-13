'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useClubStore } from '@/stores/clubStore';
import { Button, Input, Card } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { ArrowLeft } from 'lucide-react';

export default function CreateClubPage() {
  const router = useRouter();
  const { createClub } = useClubStore();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
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
          <Input
            label="Location"
            placeholder="e.g. 123 Main St, City"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
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
          <Button type="submit" loading={loading} className="w-full">
            Create Club
          </Button>
        </form>
      </Card>
    </div>
  );
}
