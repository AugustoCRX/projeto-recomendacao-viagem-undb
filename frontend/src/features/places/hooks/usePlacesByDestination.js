import { useState, useEffect } from 'react';
import { geocodeCity } from '@/services/api/geocoding';
import { getAllPlaces } from '@/services/api/overpass';

export function usePlacesByDestination(destination) {
  const [placesByType, setPlacesByType] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!destination) return;
    let active = true;
    setLoading(true);
    setError(null);
    setPlacesByType({});

    geocodeCity(destination)
      .then(({ lat, lng }) => getAllPlaces(lat, lng))
      .then((data) => { if (active) setPlacesByType(data); })
      .catch(() => { if (active) setError('Não foi possível carregar os pontos de interesse.'); })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [destination]);

  return { placesByType, loading, error };
}
