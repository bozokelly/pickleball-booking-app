'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin } from 'lucide-react';
import { loadGoogleMapsScript } from '@/utils/googleMaps';

interface AddressAutocompleteProps {
  label?: string;
  value: string;
  onChange: (value: string, coords?: { lat: number; lng: number }) => void;
  placeholder?: string;
  hint?: string;
}

export function AddressAutocomplete({
  label,
  value,
  onChange,
  placeholder = 'Search for an address...',
  hint,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [fallback, setFallback] = useState(false);

  const handlePlaceSelect = useCallback(() => {
    const place = autocompleteRef.current?.getPlace();
    const address = place?.formatted_address || place?.name || '';
    let coords: { lat: number; lng: number } | undefined;
    if (place?.geometry?.location) {
      coords = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      };
    }
    if (address) {
      onChange(address, coords);
    }
  }, [onChange]);

  useEffect(() => {
    loadGoogleMapsScript()
      .then(() => setLoaded(true))
      .catch(() => setFallback(true));
  }, []);

  useEffect(() => {
    if (!loaded || !inputRef.current || autocompleteRef.current) return;

    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      types: ['establishment', 'geocode'],
      fields: ['formatted_address', 'name', 'geometry'],
    });

    autocomplete.addListener('place_changed', handlePlaceSelect);
    autocompleteRef.current = autocomplete;

    return () => {
      google.maps.event.clearInstanceListeners(autocomplete);
    };
  }, [loaded, handlePlaceSelect]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const pacContainer = document.querySelector('.pac-container');
      if (pacContainer && pacContainer.querySelector('.pac-item-selected')) {
        e.preventDefault();
      }
    }
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-text-secondary mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full pl-10 pr-4 py-3 bg-white border border-border rounded-xl text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
        />
      </div>
      {hint && <p className="mt-1 text-sm text-text-tertiary">{hint}</p>}
      {fallback && (
        <p className="mt-1 text-xs text-text-tertiary">
          Address autocomplete unavailable — type address manually
        </p>
      )}
    </div>
  );
}
