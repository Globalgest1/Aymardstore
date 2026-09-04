'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';

export default function GeoDetector() {
  const { setDetectedLocation, detectedLocationId, locations } = useAppStore();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const cached = sessionStorage.getItem('aymard_geo_location_id');
    if (cached && locations.some(l => l.id === cached && l.active)) {
      setDetectedLocation(cached);
      return;
    }

    const detectUserLocation = async () => {
      let detectedId = 'benin'; // Default fallback

      try {
        // Fast IP country detector with 2.5s abort timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);

        const res = await fetch('https://api.country.is/', {
          signal: controller.signal,
          headers: { 'Accept': 'application/json' }
        }).catch(() => null);

        clearTimeout(timeoutId);

        if (res && res.ok) {
          const data = await res.json();
          const country = (data.country || '').toUpperCase();

          if (country === 'FR') {
            detectedId = 'france';
          } else if (country === 'BE') {
            detectedId = 'belgique';
          } else if (country === 'BJ' || ['CI', 'SN', 'TG', 'CM', 'BF', 'ML', 'NE', 'GA', 'CG', 'GN', 'TD', 'CD'].includes(country)) {
            detectedId = 'benin';
          } else if (['DE', 'IT', 'ES', 'PT', 'NL', 'LU', 'CH', 'AT'].includes(country)) {
            detectedId = 'france';
          }
        } else {
          // Timezone heuristic fallback
          const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
          if (tz.includes('Brussels')) {
            detectedId = 'belgique';
          } else if (tz.includes('Paris') || tz.includes('Europe')) {
            detectedId = 'france';
          } else {
            detectedId = 'benin';
          }
        }
      } catch {
        // Safe fallback to timezone detection
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
        if (tz.includes('Brussels')) {
          detectedId = 'belgique';
        } else if (tz.includes('Paris') || tz.includes('Europe')) {
          detectedId = 'france';
        } else {
          detectedId = 'benin';
        }
      }

      setDetectedLocation(detectedId);
      sessionStorage.setItem('aymard_geo_location_id', detectedId);
    };

    detectUserLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
