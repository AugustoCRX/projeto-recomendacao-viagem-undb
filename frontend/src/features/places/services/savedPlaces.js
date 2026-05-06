// HTTP service for /api/v1/places — user-curated places per trip.
// PlaceCreate: { trip_id, name, address?, lat?, lng?, category?, place_id? }
// PlaceResponse: { id, trip_id, user_id, name, address, lat, lng, category, place_id, saved_at, created_at }

import { backendClient } from '@/services/api';

export const savedPlacesService = {
  list: (tripId) => backendClient.get(`/api/v1/places/${tripId}`),

  save: ({ tripId, name, address, lat, lng, category = 'tourist_attraction', placeId }) =>
    backendClient.post('/api/v1/places', {
      trip_id: tripId,
      name,
      address: address ?? null,
      lat: lat ?? null,
      lng: lng ?? null,
      category,
      place_id: placeId ?? null,
    }),

  remove: (placeId) => backendClient.delete(`/api/v1/places/${placeId}`),
};
