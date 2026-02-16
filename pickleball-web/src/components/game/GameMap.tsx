'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { format } from 'date-fns';
import { loadGoogleMapsScript } from '@/utils/googleMaps';
import { Game } from '@/types/database';
import { SKILL_LEVEL_LABELS } from '@/constants/theme';
import { MapPin } from 'lucide-react';

interface GameMapProps {
  games: Game[];
}

export function GameMap({ games }: GameMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadGoogleMapsScript()
      .then(() => setLoaded(true))
      .catch(() => setError(true));
  }, []);

  const initMap = useCallback(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const gamesWithCoords = games.filter((g) => g.latitude != null && g.longitude != null);

    // Default center: first game with coords, or Sydney, AU
    const center = gamesWithCoords.length > 0
      ? { lat: gamesWithCoords[0].latitude!, lng: gamesWithCoords[0].longitude! }
      : { lat: -31.95, lng: 115.86 };

    const map = new google.maps.Map(mapRef.current, {
      center,
      zoom: 11,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      styles: [
        { featureType: 'poi', stylers: [{ visibility: 'off' }] },
        { featureType: 'transit', stylers: [{ visibility: 'off' }] },
      ],
    });

    mapInstanceRef.current = map;
    infoWindowRef.current = new google.maps.InfoWindow();

    // Fit bounds to all markers
    if (gamesWithCoords.length > 1) {
      const bounds = new google.maps.LatLngBounds();
      gamesWithCoords.forEach((g) => bounds.extend({ lat: g.latitude!, lng: g.longitude! }));
      map.fitBounds(bounds, 50);
    }
  }, [games]);

  // Create/update markers when games change
  useEffect(() => {
    if (!loaded || !mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const map = mapInstanceRef.current;
    const infoWindow = infoWindowRef.current!;

    const gamesWithCoords = games.filter((g) => g.latitude != null && g.longitude != null);

    gamesWithCoords.forEach((game) => {
      const marker = new google.maps.Marker({
        position: { lat: game.latitude!, lng: game.longitude! },
        map,
        title: game.title,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#007AFF',
          fillOpacity: 0.9,
          strokeColor: '#fff',
          strokeWeight: 2,
        },
      });

      const dateTime = new Date(game.date_time);
      const spotsLeft = game.max_spots - (game.confirmed_count || 0);

      const content = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 240px; padding: 4px;">
          <h3 style="margin: 0 0 4px; font-size: 14px; font-weight: 600;">${game.title}</h3>
          ${game.club ? `<p style="margin: 0 0 4px; font-size: 12px; color: #666;">${game.club.name}</p>` : ''}
          <p style="margin: 0 0 2px; font-size: 12px;">
            ${format(dateTime, 'MMM d, h:mm a')} &middot; ${game.duration_minutes}min
          </p>
          <p style="margin: 0 0 2px; font-size: 12px;">
            ${SKILL_LEVEL_LABELS[game.skill_level]} &middot; ${spotsLeft <= 0 ? 'Full' : `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} left`}
          </p>
          ${game.fee_amount > 0 ? `<p style="margin: 0; font-size: 12px; font-weight: 500;">${game.fee_amount.toFixed(2)}</p>` : '<p style="margin: 0; font-size: 12px; color: #34C759;">Free</p>'}
          <a href="/dashboard/game/${game.id}" style="display: inline-block; margin-top: 6px; font-size: 12px; color: #007AFF; text-decoration: none;">View Details &rarr;</a>
        </div>
      `;

      marker.addListener('click', () => {
        infoWindow.setContent(content);
        infoWindow.open(map, marker);
      });

      markersRef.current.push(marker);
    });
  }, [loaded, games]);

  // Initialize map once loaded
  useEffect(() => {
    if (loaded) initMap();
  }, [loaded, initMap]);

  if (error) {
    return (
      <div className="bg-background border border-border rounded-xl p-6 text-center">
        <MapPin className="h-8 w-8 text-text-tertiary mx-auto mb-2" />
        <p className="text-sm text-text-secondary">Map unavailable</p>
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      className="w-full h-[300px] rounded-xl border border-border overflow-hidden bg-background"
    />
  );
}
