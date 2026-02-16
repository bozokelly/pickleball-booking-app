let googleScriptLoaded = false;
let googleScriptPromise: Promise<void> | null = null;

export function loadGoogleMapsScript(): Promise<void> {
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
