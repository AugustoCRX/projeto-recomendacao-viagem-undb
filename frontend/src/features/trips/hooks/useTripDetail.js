import { useState, useEffect, useCallback } from 'react';
import { tripsRepository } from '../services/trips';

export function useTripDetail(id) {
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    if (!id) return;
    setLoading(true);
    tripsRepository
      .getById(id)
      .then(setTrip)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const updateTrip = useCallback(async (data) => {
    const updated = await tripsRepository.update(id, data);
    setTrip(updated);
    return updated;
  }, [id]);

  return { trip, loading, error, updateTrip };
}
