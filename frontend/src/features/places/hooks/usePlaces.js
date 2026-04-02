// Tenta buscar lugares via backend (Google Places).
// Se o backend não estiver disponível (VITE_USE_BACKEND != true), usa mock.

import { useState, useEffect } from 'react';
import { getPlacesByDestination } from '@/services/api/places';
import { placesCache } from '../services/placesCache';

const USE_BACKEND = import.meta.env.VITE_USE_BACKEND === 'true';

export function usePlaces(destination, type = 'tourist_attraction') {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [source, setSource] = useState(null); // 'api' | 'mock'

  useEffect(() => {
    if (!destination) return;

    setLoading(true);
    setError(null);

    const fetchPlaces = USE_BACKEND
      ? getPlacesByDestination(destination, type)
          .then((data) => { setSource('api'); return data; })
          .catch(() =>
            placesCache.getByType(type).then((data) => { setSource('mock'); return data; })
          )
      : placesCache.getByType(type).then((data) => { setSource('mock'); return data; });

    fetchPlaces
      .then(setPlaces)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [destination, type]);

  return { places, loading, error, source };
}
