'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { Booking } from '@/types/database';
import { User, Clock, Loader2, XCircle } from 'lucide-react';

interface ParticipantListProps {
  gameId: string;
  maxSpots: number;
}

export function ParticipantList({ gameId, maxSpots }: ParticipantListProps) {
  const [confirmed, setConfirmed] = useState<Booking[]>([]);
  const [waitlisted, setWaitlisted] = useState<Booking[]>([]);
  const [cancelled, setCancelled] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      try {
        const { data } = await supabase
          .from('bookings')
          .select('*, profile:profiles(full_name, avatar_url)')
          .eq('game_id', gameId)
          .order('created_at', { ascending: true });
        if (data) {
          setConfirmed(data.filter((b) => b.status === 'confirmed'));
          setWaitlisted(data.filter((b) => b.status === 'waitlisted'));
          setCancelled(data.filter((b) => b.status === 'cancelled'));
        }
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [gameId]);

  if (loading) {
    return (
      <div>
        <h4 className="text-sm font-semibold text-text-secondary">Players</h4>
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-text-tertiary" />
        </div>
      </div>
    );
  }

  const emptySpots = Math.max(0, maxSpots - confirmed.length);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Confirmed players */}
      <div>
        <h4 className="text-sm font-semibold text-text-secondary mb-2">
          Players ({confirmed.length}/{maxSpots})
        </h4>
        <div className="space-y-2">
          {confirmed.map((booking) => (
            <div key={booking.id} className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                {booking.profile?.avatar_url ? (
                  <Image src={booking.profile.avatar_url} alt="" width={28} height={28} className="h-7 w-7 rounded-full object-cover" />
                ) : (
                  <User className="h-3.5 w-3.5 text-primary" />
                )}
              </div>
              <span className="text-sm text-text-primary truncate">
                {booking.profile?.full_name || 'Player'}
              </span>
            </div>
          ))}
          {Array.from({ length: emptySpots }).map((_, i) => (
            <div key={`empty-${i}`} className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-background border-2 border-dashed border-border flex items-center justify-center flex-shrink-0">
                <User className="h-3.5 w-3.5 text-text-tertiary" />
              </div>
              <span className="text-sm text-text-tertiary">Open spot</span>
            </div>
          ))}
        </div>
      </div>

      {/* Waitlist */}
      <div>
        <h4 className="text-sm font-semibold text-text-secondary mb-2">
          Waitlist ({waitlisted.length})
        </h4>
        {waitlisted.length === 0 ? (
          <p className="text-xs text-text-tertiary">No one waiting</p>
        ) : (
          <div className="space-y-2">
            {waitlisted.map((booking, index) => (
              <div key={booking.id} className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-warning/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="h-3.5 w-3.5 text-warning" />
                </div>
                <span className="text-sm text-text-secondary truncate">
                  #{index + 1} {booking.profile?.full_name || 'Player'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cancelled */}
      <div>
        <h4 className="text-sm font-semibold text-text-secondary mb-2">
          Cancelled ({cancelled.length})
        </h4>
        {cancelled.length === 0 ? (
          <p className="text-xs text-text-tertiary">No cancellations</p>
        ) : (
          <div className="space-y-2">
            {cancelled.map((booking) => (
              <div key={booking.id} className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                  <XCircle className="h-3.5 w-3.5 text-red-400" />
                </div>
                <span className="text-sm text-text-tertiary line-through truncate">
                  {booking.profile?.full_name || 'Player'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
