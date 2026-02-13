'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { format, isSameDay, parseISO } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { useGameStore } from '@/stores/gameStore';
import { Card, Badge } from '@/components/ui';
import { Clock, MapPin } from 'lucide-react';

export default function CalendarPage() {
  const { myBookings, fetchMyBookings } = useGameStore();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  useEffect(() => {
    fetchMyBookings();
  }, [fetchMyBookings]);

  const bookedDates = useMemo(() => {
    return myBookings
      .filter((b) => b.game?.date_time)
      .map((b) => parseISO(b.game!.date_time));
  }, [myBookings]);

  const selectedBookings = useMemo(() => {
    return myBookings.filter(
      (b) => b.game?.date_time && isSameDay(parseISO(b.game.date_time), selectedDate)
    );
  }, [myBookings, selectedDate]);

  const allBookingsSorted = useMemo(() => {
    return [...myBookings]
      .filter((b) => b.game?.date_time)
      .sort((a, b) => new Date(a.game!.date_time).getTime() - new Date(b.game!.date_time).getTime());
  }, [myBookings]);

  const displayBookings = selectedBookings.length > 0 ? selectedBookings : allBookingsSorted;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">My Calendar</h1>

      <Card className="p-4 flex justify-center">
        <DayPicker
          mode="single"
          selected={selectedDate}
          onSelect={(date) => date && setSelectedDate(date)}
          modifiers={{ booked: bookedDates }}
          modifiersClassNames={{ booked: 'rdp-day_booked' }}
          styles={{
            months: { display: 'flex', justifyContent: 'center' },
          }}
        />
      </Card>

      <style jsx global>{`
        .rdp-day_booked::after {
          content: '';
          display: block;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #007AFF;
          margin: 2px auto 0;
        }
      `}</style>

      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-3">
          {selectedBookings.length > 0
            ? `Games on ${format(selectedDate, 'MMM d, yyyy')}`
            : 'All Upcoming Games'}
        </h2>

        {displayBookings.length === 0 ? (
          <p className="text-text-secondary text-sm">No booked games yet</p>
        ) : (
          <div className="space-y-3">
            {displayBookings.map((booking) => {
              const game = booking.game;
              if (!game) return null;
              const dateTime = new Date(game.date_time);
              return (
                <Link key={booking.id} href={`/dashboard/game/${game.id}`}>
                  <Card className="hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-text-primary">{game.title}</h3>
                        <div className="flex gap-3 mt-1 text-sm text-text-secondary">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {format(dateTime, 'MMM d, h:mm a')}
                          </span>
                          {game.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {game.location}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge
                        label={booking.status === 'confirmed' ? 'Confirmed' : 'Waitlisted'}
                        color={booking.status === 'confirmed' ? '#34C759' : '#FF9500'}
                      />
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
