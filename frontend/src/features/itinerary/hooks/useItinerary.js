import { useState, useEffect, useCallback } from 'react';
import { itineraryCache } from '../services/itineraryCache';
import { itineraryService } from '../services/itinerary';

const USE_BACKEND = import.meta.env.VITE_USE_BACKEND === 'true';

export function useItinerary(trip) {
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!trip?.id) {
      setLoading(false);
      return;
    }

    if (USE_BACKEND) {
      itineraryService
        .getByTrip(trip.id)
        .then(setDays)
        .catch(() => setDays([]))
        .finally(() => setLoading(false));
    } else {
      if (!trip.startDate || !trip.endDate) {
        setLoading(false);
        return;
      }
      itineraryCache
        .getOrInit(trip)
        .then(setDays)
        .finally(() => setLoading(false));
    }
  }, [trip?.id]);

  const addActivity = useCallback(
    async (dayId, activity) => {
      if (USE_BACKEND) {
        const day = days.find((d) => d.id === dayId);
        if (!day) return;
        await itineraryService.addActivity(trip.id, day.date, activity);
        const updated = await itineraryService.getByTrip(trip.id);
        setDays(updated);
      } else {
        const updated = await itineraryCache.addActivity(trip.id, dayId, activity);
        setDays(updated);
      }
    },
    [trip?.id, days],
  );

  const removeActivity = useCallback(
    async (dayId, activityId) => {
      if (USE_BACKEND) {
        await itineraryService.removeActivity(activityId);
        const updated = await itineraryService.getByTrip(trip.id);
        setDays(updated);
      } else {
        const updated = await itineraryCache.removeActivity(trip.id, dayId, activityId);
        setDays(updated);
      }
    },
    [trip?.id],
  );

  const updateActivity = useCallback(
    async (dayId, activityId, updates) => {
      if (USE_BACKEND) {
        await itineraryService.updateActivity(activityId, updates);
        const updated = await itineraryService.getByTrip(trip.id);
        setDays(updated);
      } else {
        const updated = await itineraryCache.updateActivity(trip.id, dayId, activityId, updates);
        setDays(updated);
      }
    },
    [trip?.id],
  );

  return { days, loading, addActivity, removeActivity, updateActivity };
}
