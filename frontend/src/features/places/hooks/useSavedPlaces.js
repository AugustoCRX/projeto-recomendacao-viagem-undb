import { useState, useEffect, useCallback } from 'react';
import { savedPlacesService } from '../services/savedPlaces';

const USE_BACKEND = import.meta.env.VITE_USE_BACKEND === 'true';

export function useSavedPlaces(tripId) {
  const [savedPlaces, setSavedPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  // Track which place_ids are in a pending request to avoid double-saves
  const [pending, setPending] = useState(new Set());

  useEffect(() => {
    if (!tripId || !USE_BACKEND) return;
    setLoading(true);
    savedPlacesService
      .list(tripId)
      .then(setSavedPlaces)
      .catch(() => setSavedPlaces([]))
      .finally(() => setLoading(false));
  }, [tripId]);

  // Check if an external place (by its Overpass/external id) is already saved
  const isSaved = useCallback(
    (externalId) => savedPlaces.some((s) => s.place_id === externalId),
    [savedPlaces],
  );

  // Get the backend UUID of a saved entry by its external id (needed for removal)
  const getSavedId = useCallback(
    (externalId) => savedPlaces.find((s) => s.place_id === externalId)?.id ?? null,
    [savedPlaces],
  );

  const savePlace = useCallback(
    async ({ name, address, lat, lng, category, placeId }) => {
      if (!USE_BACKEND || pending.has(placeId)) return;
      setPending((p) => new Set(p).add(placeId));
      try {
        const saved = await savedPlacesService.save({ tripId, name, address, lat, lng, category, placeId });
        setSavedPlaces((prev) => [...prev, saved]);
      } finally {
        setPending((p) => { const next = new Set(p); next.delete(placeId); return next; });
      }
    },
    [tripId, pending],
  );

  const removePlace = useCallback(
    async (savedId) => {
      if (!USE_BACKEND) return;
      // Optimistic removal
      setSavedPlaces((prev) => prev.filter((s) => s.id !== savedId));
      try {
        await savedPlacesService.remove(savedId);
      } catch {
        // Revert on failure — re-fetch
        savedPlacesService.list(tripId).then(setSavedPlaces).catch(() => {});
      }
    },
    [tripId],
  );

  return { savedPlaces, loading, isSaved, getSavedId, savePlace, removePlace, pending };
}
