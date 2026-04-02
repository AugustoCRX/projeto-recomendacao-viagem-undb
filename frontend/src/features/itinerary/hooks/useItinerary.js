import { useState, useEffect, useCallback } from 'react';
import { itineraryCache } from '../services/itineraryCache';

export function useItinerary(trip) {
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!trip?.id || !trip?.startDate || !trip?.endDate) {
      setLoading(false);
      return;
    }
    itineraryCache
      .getOrInit(trip)
      .then(setDays)
      .finally(() => setLoading(false));
  }, [trip?.id]);

  const addActivity = useCallback(
    async (dayId, activity) => {
      const updated = await itineraryCache.addActivity(trip.id, dayId, activity);
      setDays(updated);
    },
    [trip?.id],
  );

  const removeActivity = useCallback(
    async (dayId, activityId) => {
      const updated = await itineraryCache.removeActivity(trip.id, dayId, activityId);
      setDays(updated);
    },
    [trip?.id],
  );

  return { days, loading, addActivity, removeActivity };
}
