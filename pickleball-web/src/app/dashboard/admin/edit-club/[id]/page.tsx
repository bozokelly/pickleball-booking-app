'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button, Input, Card, AddressAutocomplete, MarkdownEditor } from '@/components/ui';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { useClubStore } from '@/stores/clubStore';
import { ArrowLeft, Loader2, Trash2 } from 'lucide-react';

export default function EditClubPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: clubId } = use(params);
  const router = useRouter();
  const { showToast } = useToast();
  const { deleteClub } = useClubStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [membersOnly, setMembersOnly] = useState(false);

  useEffect(() => {
    async function loadClub() {
      const { data, error } = await supabase
        .from('clubs')
        .select('*')
        .eq('id', clubId)
        .single();
      if (error || !data) {
        showToast('Club not found', 'error');
        router.back();
        return;
      }
      setName(data.name);
      setLocation(data.location || '');
      setLatitude(data.latitude ?? null);
      setLongitude(data.longitude ?? null);
      setDescription(data.description || '');
      setContactEmail(data.contact_email || '');
      setContactPhone(data.contact_phone || '');
      setWebsite(data.website || '');
      setMembersOnly(data.members_only);
      setLoading(false);
    }
    loadClub();
  }, [clubId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Club name is required', 'error');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from('clubs').update({
        name: name.trim(),
        location: location.trim() || null,
        latitude,
        longitude,
        description: description.trim() || null,
        contact_email: contactEmail.trim() || null,
        contact_phone: contactPhone.trim() || null,
        website: website.trim() || null,
        members_only: membersOnly,
      }).eq('id', clubId);

      if (error) throw new Error(error.message);
      showToast('Club updated!', 'success');
      router.push('/dashboard/admin');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update club';
      showToast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteClub(clubId);
      showToast('Club deleted', 'success');
      router.push('/dashboard/admin');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete club';
      showToast(message, 'error');
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <h1 className="text-2xl font-bold text-text-primary">Edit Club</h1>

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
            onChange={(val, coords) => {
              setLocation(val);
              if (coords) {
                setLatitude(coords.lat);
                setLongitude(coords.lng);
              }
            }}
          />
          <MarkdownEditor
            label="Description"
            placeholder="Tell people about your club..."
            value={description}
            onChange={setDescription}
            rows={4}
          />

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

          {/* Members only toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-primary">Members Only</p>
              <p className="text-xs text-text-tertiary">Require membership to book games</p>
            </div>
            <button
              type="button"
              onClick={() => setMembersOnly(!membersOnly)}
              className={`relative w-11 h-6 rounded-full transition-colors ${membersOnly ? 'bg-primary' : 'bg-border'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${membersOnly ? 'translate-x-5' : ''}`} />
            </button>
          </div>

          <Button type="submit" loading={saving} className="w-full">
            Save Changes
          </Button>
        </form>
      </Card>

      {/* Danger zone */}
      <Card className="p-6 border-error/30">
        <h3 className="text-sm font-semibold text-error mb-2">Danger Zone</h3>
        <p className="text-sm text-text-secondary mb-4">
          Permanently delete this club and all associated games and bookings. This cannot be undone.
        </p>
        <Button
          variant="danger"
          size="sm"
          icon={<Trash2 className="h-4 w-4" />}
          loading={deleting}
          onClick={() => setShowDeleteDialog(true)}
        >
          Delete Club
        </Button>
      </Card>

      <ConfirmDialog
        open={showDeleteDialog}
        title="Delete Club"
        message="Are you sure you want to delete this club? All games under this club will also be deleted. This action cannot be undone."
        confirmLabel="Delete Club"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </div>
  );
}
