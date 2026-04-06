import { useState, useEffect } from 'react';
import { geocodeCity } from '@/services/api/geocoding';

export function useGeocode(city) {
  const [coords, setCoords] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!city) return;
    let active = true;
    setLoading(true);
    setError(null);
    geocodeCity(city)
      .then((c) => { if (active) setCoords(c); })
      .catch((e) => { if (active) setError(e.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [city]);

  return { coords, loading, error };
}
