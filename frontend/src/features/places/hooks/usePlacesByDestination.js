import { useState, useEffect } from 'react';
import { getPlacesByDestination } from '@/services/api/places';

const TYPES = ['tourist_attraction', 'restaurant', 'lodging'];

function mapPlace(p) {
  return {
    id: p.place_id,
    name: p.name,
    type: p.category,
    address: p.address ?? null,
    lat: p.lat,
    lng: p.lng,
    website: p.tags?.website ?? p.tags?.['contact:website'] ?? null,
    openingHours: p.tags?.opening_hours ?? null,
  };
}

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

    Promise.all(TYPES.map((type) => getPlacesByDestination(destination, type)))
      .then((results) => {
        if (!active) return;
        const grouped = {};
        TYPES.forEach((type, i) => {
          grouped[type] = results[i].map(mapPlace);
        });
        setPlacesByType(grouped);
      })
      .catch(() => {
        if (active) setError('Não foi possível carregar os pontos de interesse.');
      })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [destination]);

  return { placesByType, loading, error };
}
