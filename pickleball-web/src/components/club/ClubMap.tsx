'use client';

import { useEffect, useRef, useState } from 'react';
import { loadGoogleMapsScript } from '@/utils/googleMaps';
import { Club } from '@/types/database';
import { MapPin } from 'lucide-react';

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

interface ClubMapProps {
  clubs: Club[];
}

// Inject the pulse keyframes once
let styleInjected = false;
function injectPulseStyle() {
  if (styleInjected) return;
  styleInjected = true;
  const style = document.createElement('style');
  style.textContent = `
    @keyframes clubPulse {
      0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0.7; }
      100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}

export function ClubMap({ clubs }: ClubMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const overlaysRef = useRef<google.maps.OverlayView[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadGoogleMapsScript()
      .then(() => setLoaded(true))
      .catch(() => setError(true));
  }, []);

  // Initialize the map (once) when Google Maps script loads
  useEffect(() => {
    if (!loaded || !mapRef.current || mapInstanceRef.current) return;

    const map = new google.maps.Map(mapRef.current, {
      center: { lat: -31.95, lng: 115.86 },
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
  }, [loaded]);

  // Add/update overlays and fit bounds whenever clubs change
  useEffect(() => {
    if (!loaded || !mapInstanceRef.current) return;

    injectPulseStyle();

    // Clear existing overlays
    overlaysRef.current.forEach((o) => o.setMap(null));
    overlaysRef.current = [];

    const map = mapInstanceRef.current;
    const infoWindow = infoWindowRef.current!;

    const clubsWithCoords = clubs.filter((c) => c.latitude != null && c.longitude != null);

    // Fit map bounds to show all clubs
    if (clubsWithCoords.length === 1) {
      map.setCenter({ lat: clubsWithCoords[0].latitude!, lng: clubsWithCoords[0].longitude! });
      map.setZoom(13);
    } else if (clubsWithCoords.length > 1) {
      const bounds = new google.maps.LatLngBounds();
      clubsWithCoords.forEach((c) => bounds.extend({ lat: c.latitude!, lng: c.longitude! }));
      map.fitBounds(bounds, 50);
    }

    clubsWithCoords.forEach((club) => {
      const pos = new google.maps.LatLng(club.latitude!, club.longitude!);

      // Custom overlay with green dot + pulse
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.cursor = 'pointer';
      container.innerHTML = `
        <div style="position: relative; width: 60px; height: 60px;">
          <div style="position: absolute; top: 50%; left: 50%; width: 60px; height: 60px; transform: translate(-50%, -50%); border-radius: 50%; background: rgba(52,199,89,0.3); animation: clubPulse 2s ease-out infinite;"></div>
          <div style="position: absolute; top: 50%; left: 50%; width: 18px; height: 18px; transform: translate(-50%, -50%); background: #34C759; border: 2.5px solid #fff; border-radius: 50%; box-shadow: 0 0 8px rgba(52,199,89,0.5); z-index: 2;"></div>
        </div>
      `;

      const content = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 220px; padding: 4px;">
          <h3 style="margin: 0 0 4px; font-size: 14px; font-weight: 600;">${escapeHtml(club.name)}</h3>
          ${club.location ? `<p style="margin: 0 0 4px; font-size: 12px; color: #666;">${escapeHtml(club.location)}</p>` : ''}
          ${club.members_only ? '<p style="margin: 0 0 4px; font-size: 11px; color: #FF9500; font-weight: 500;">Members Only</p>' : '<p style="margin: 0 0 4px; font-size: 11px; color: #34C759; font-weight: 500;">Open Club</p>'}
          <a href="/dashboard/club/${encodeURIComponent(club.id)}" style="display: inline-block; margin-top: 4px; font-size: 12px; color: #007AFF; text-decoration: none; font-weight: 500;">View Club &rarr;</a>
        </div>
      `;

      container.addEventListener('click', () => {
        infoWindow.setContent(content);
        infoWindow.setPosition(pos);
        infoWindow.open(map);
      });

      const overlay = new google.maps.OverlayView();
      overlay.onAdd = function () {
        this.getPanes()?.overlayMouseTarget.appendChild(container);
      };
      overlay.draw = function () {
        const point = this.getProjection().fromLatLngToDivPixel(pos);
        if (point) {
          container.style.left = `${point.x - 30}px`;
          container.style.top = `${point.y - 30}px`;
        }
      };
      overlay.onRemove = function () {
        container.remove();
      };
      overlay.setMap(map);
      overlaysRef.current.push(overlay);
    });
  }, [loaded, clubs]);

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
