// HTTP service for /api/v1/itinerary — maps backend ItemResponse to the
// shape that useItinerary and ActivityCard expect.

import { backendClient } from '@/services/api';

function normalizeItem(item) {
  return {
    id: item.id,
    title: item.title,
    time: item.time ?? '',
    notes: item.description ?? '',
    type: 'free', // backend has no type field; UI falls back to neutral icon
    date: item.date,
  };
}

function normalizeDays(days) {
  return days.map((day) => ({
    id: `day-${day.day_number}`,
    date: day.date,
    dayNumber: day.day_number,
    activities: day.activities.map(normalizeItem),
  }));
}

export const itineraryService = {
  getByTrip(tripId) {
    return backendClient.get(`/api/v1/itinerary/${tripId}`).then(normalizeDays);
  },

  async addActivity(tripId, date, activity) {
    const item = await backendClient.post('/api/v1/itinerary', {
      trip_id: tripId,
      date,
      time: activity.time || null,
      title: activity.title,
      description: activity.notes || null,
      order: 0,
    });
    return normalizeItem(item);
  },

  async updateActivity(itemId, updates) {
    const item = await backendClient.put(`/api/v1/itinerary/${itemId}`, {
      ...(updates.time !== undefined && { time: updates.time || null }),
      ...(updates.title !== undefined && { title: updates.title }),
      ...(updates.notes !== undefined && { description: updates.notes || null }),
    });
    return normalizeItem(item);
  },

  removeActivity(itemId) {
    return backendClient.delete(`/api/v1/itinerary/${itemId}`);
  },
};
