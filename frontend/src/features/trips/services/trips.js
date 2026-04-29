// Unified trips repository.
// Uses localStorage cache by default.
// Set VITE_USE_BACKEND=true to switch to the HTTP backend.

import { backendClient } from '@/services/api';
import { tripsCache } from './tripsCache';

const USE_BACKEND = import.meta.env.VITE_USE_BACKEND === 'true';

const httpService = {
  list: () => backendClient.get('/api/v1/trips'),
  getById: (id) => backendClient.get(`/api/v1/trips/${id}`),
  create: (data) => backendClient.post('/api/v1/trips', data),
  update: (id, data) => backendClient.put(`/api/v1/trips/${id}`, data),
  remove: (id) => backendClient.delete(`/api/v1/trips/${id}`),
};

export const tripsRepository = USE_BACKEND ? httpService : tripsCache;
