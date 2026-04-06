import { useState, useEffect } from 'react';
import { getAllPlaces } from '@/services/api/overpass';

export function useOverpassPlaces(coords) {
  const [places, setPlaces] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!coords) return;
    let active = true;
    setLoading(true);
    setError(null);
    setPlaces({});
    getAllPlaces(coords.lat, coords.lng)
      .then((data) => { if (active) setPlaces(data); })
      .catch(() => { if (active) setError('Não foi possível carregar os pontos de interesse.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [coords?.lat, coords?.lng]);

  return { places, loading, error };
}
