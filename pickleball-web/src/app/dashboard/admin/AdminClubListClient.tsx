'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useClubStore } from '@/stores/clubStore';
import { Button, Card } from '@/components/ui';
import { Plus, Shield, MapPin, ChevronRight } from 'lucide-react';
import { CLUB_AVATAR_COLORS } from '@/constants/theme';

function getClubColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return CLUB_AVATAR_COLORS[Math.abs(hash) % CLUB_AVATAR_COLORS.length];
}

export function AdminClubListClient() {
  const { myAdminClubs, fetchMyAdminClubs } = useClubStore();

  useEffect(() => {
    fetchMyAdminClubs();
  }, [fetchMyAdminClubs]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-text-primary tracking-tight">Admin</h1>
        <Link href="/dashboard/admin/create-club">
          <Button size="sm" icon={<Plus className="h-4 w-4" />}>Create Club</Button>
        </Link>
      </div>

      {myAdminClubs.length === 0 ? (
        <div className="text-center py-16">
          <div className="h-16 w-16 rounded-full bg-background flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-text-tertiary" />
          </div>
          <p className="text-text-secondary font-medium">You don&apos;t manage any clubs yet</p>
          <Link href="/dashboard/admin/create-club" className="text-primary text-sm hover:underline mt-2 inline-block">
            Create your first club
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {myAdminClubs.map((club) => {
            const color = getClubColor(club.name);
            return (
              <Link key={club.id} href={`/dashboard/admin/club/${club.id}`}>
                <Card className="p-4 hover:shadow-md transition-all cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div
                      className="h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: color }}
                    >
                      <span className="text-white font-bold text-xl">
                        {club.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-text-primary truncate">{club.name}</p>
                      {club.location && (
                        <p className="text-sm text-text-secondary flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          {club.location}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-xs text-text-tertiary hidden sm:block">Open Dashboard</span>
                      <ChevronRight className="h-5 w-5 text-text-tertiary group-hover:text-text-primary transition-colors" />
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
