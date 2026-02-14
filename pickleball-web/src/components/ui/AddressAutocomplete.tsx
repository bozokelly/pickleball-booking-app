'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin } from 'lucide-react';

interface AddressAutocompleteProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
}

let googleScriptLoaded = false;
let googleScriptPromise: Promise<void> | null = null;

function loadGoogleMapsScript(): Promise<void> {
  if (googleScriptLoaded) return Promise.resolve();
  if (googleScriptPromise) return googleScriptPromise;

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey || apiKey === 'your-google-maps-api-key-here') {
    return Promise.reject(new Error('Google Maps API key not configured'));
  }

  googleScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      googleScriptLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });

  return googleScriptPromise;
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
    if (place?.formatted_address) {
      onChange(place.formatted_address);
    } else if (place?.name) {
      onChange(place.name);
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
      types: ['address'],
      fields: ['formatted_address', 'name', 'geometry'],
    });

    autocomplete.addListener('place_changed', handlePlaceSelect);
    autocompleteRef.current = autocomplete;

    return () => {
      google.maps.event.clearInstanceListeners(autocomplete);
    };
  }, [loaded, handlePlaceSelect]);

  // Prevent form submission when selecting from dropdown with Enter
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
