'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { Booking } from '@/types/database';
import { User, Clock, Loader2 } from 'lucide-react';

interface ParticipantListProps {
  gameId: string;
  maxSpots: number;
}

export function ParticipantList({ gameId, maxSpots }: ParticipantListProps) {
  const [confirmed, setConfirmed] = useState<Booking[]>([]);
  const [waitlisted, setWaitlisted] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      try {
        const { data } = await supabase
          .from('bookings')
          .select('*, profile:profiles(full_name, avatar_url)')
          .eq('game_id', gameId)
          .neq('status', 'cancelled')
          .order('created_at', { ascending: true });
        if (data) {
          setConfirmed(data.filter((b) => b.status === 'confirmed'));
          setWaitlisted(data.filter((b) => b.status === 'waitlisted'));
        }
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [gameId]);

  if (loading) {
    return (
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-text-secondary">Players</h4>
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-text-tertiary" />
        </div>
      </div>
    );
  }

  const emptySpots = Math.max(0, maxSpots - confirmed.length);

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-semibold text-text-secondary mb-2">
          Players ({confirmed.length}/{maxSpots})
        </h4>
        <div className="space-y-2">
          {confirmed.map((booking) => (
            <div key={booking.id} className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                {booking.profile?.avatar_url ? (
                  <Image src={booking.profile.avatar_url} alt="" width={32} height={32} className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <User className="h-4 w-4 text-primary" />
                )}
              </div>
              <span className="text-sm text-text-primary">
                {booking.profile?.full_name || 'Player'}
              </span>
            </div>
          ))}
          {Array.from({ length: emptySpots }).map((_, i) => (
            <div key={`empty-${i}`} className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-background border-2 border-dashed border-border flex items-center justify-center">
                <User className="h-4 w-4 text-text-tertiary" />
              </div>
              <span className="text-sm text-text-tertiary">Open spot</span>
            </div>
          ))}
        </div>
      </div>

      {waitlisted.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-text-secondary mb-2">
            Waitlist ({waitlisted.length})
          </h4>
          <div className="space-y-2">
            {waitlisted.map((booking, index) => (
              <div key={booking.id} className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-warning/10 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-warning" />
                </div>
                <span className="text-sm text-text-secondary">
                  #{index + 1} {booking.profile?.full_name || 'Player'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
