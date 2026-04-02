// Unified trips repository.
// Uses localStorage cache by default.
// Set VITE_USE_BACKEND=true to switch to the HTTP backend.

import { backendClient } from '@/services/api';
import { tripsCache } from './tripsCache';

const USE_BACKEND = import.meta.env.VITE_USE_BACKEND === 'true';

const httpService = {
  list: () => backendClient.get('/trips'),
  getById: (id) => backendClient.get(`/trips/${id}`),
  create: (data) => backendClient.post('/trips', data),
  update: (id, data) => backendClient.put(`/trips/${id}`, data),
  remove: (id) => backendClient.delete(`/trips/${id}`),
};

export const tripsRepository = USE_BACKEND ? httpService : tripsCache;
