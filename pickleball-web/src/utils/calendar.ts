import { format, addMinutes } from 'date-fns';
import { Game } from '@/types/database';

function formatICSDate(date: Date): string {
  return format(date, "yyyyMMdd'T'HHmmss");
}

export function downloadGameICS(game: Game): void {
  const start = new Date(game.date_time);
  const end = addMinutes(start, game.duration_minutes);

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Book a Dink//EN',
    'BEGIN:VEVENT',
    `DTSTART:${formatICSDate(start)}`,
    `DTEND:${formatICSDate(end)}`,
    `SUMMARY:${game.title}`,
    game.location ? `LOCATION:${game.location}` : '',
    game.description ? `DESCRIPTION:${game.description}` : '',
    'BEGIN:VALARM',
    'TRIGGER:-PT60M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Game starts in 1 hour',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${game.title.replace(/[^a-z0-9]/gi, '_')}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
