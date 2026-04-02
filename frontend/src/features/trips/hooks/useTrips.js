import { useState, useEffect, useCallback } from 'react';
import { tripsRepository } from '../services/trips';

export function useTrips() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    tripsRepository
      .list()
      .then(setTrips)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const removeTrip = useCallback(async (id) => {
    await tripsRepository.remove(id);
    setTrips((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { trips, loading, error, reload: load, removeTrip };
}
