import { backendClient } from '@/services/api';

export const aiPlannerService = {
  generate: (tripId, preferences = '', persist = true) =>
    backendClient.post('/api/v1/ai/generate-plan', {
      trip_id: tripId,
      preferences: preferences || '',
      persist,
    }),

  getPlan: (tripId) => backendClient.get(`/api/v1/ai/plan/${tripId}`),
};
