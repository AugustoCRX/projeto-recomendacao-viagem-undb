// Unified trips repository.
// Uses localStorage cache by default.
// Set VITE_USE_BACKEND=true to switch to the HTTP backend.

import { backendClient } from '@/services/api';
import { tripsCache } from './tripsCache';

const USE_BACKEND = import.meta.env.VITE_USE_BACKEND === 'true';

// Backend returns snake_case; all frontend components expect camelCase.
function normalize(trip) {
  return {
    id: trip.id,
    userId: trip.user_id,
    name: trip.name,
    destination: trip.destination,
    country: trip.country ?? null,
    startDate: trip.start_date,
    endDate: trip.end_date,
    budget: trip.budget != null ? Number(trip.budget) : null,
    currency: trip.currency,
    status: trip.status,
    notes: trip.notes ?? null,
    coverPhoto: trip.cover_photo ?? null,
    createdAt: trip.created_at,
    updatedAt: trip.updated_at,
  };
}

// Frontend sends camelCase form data; backend expects snake_case.
function serialize(data) {
  const out = {};
  if (data.name !== undefined)        out.name = data.name;
  if (data.destination !== undefined) out.destination = data.destination;
  if (data.country !== undefined)     out.country = data.country || null;
  if (data.startDate !== undefined)   out.start_date = data.startDate;
  if (data.endDate !== undefined)     out.end_date = data.endDate;
  if (data.budget !== undefined)      out.budget = data.budget;
  if (data.currency !== undefined)    out.currency = data.currency;
  if (data.status !== undefined)      out.status = data.status;
  if (data.notes !== undefined)       out.notes = data.notes || null;
  if (data.coverPhoto !== undefined)  out.cover_photo = data.coverPhoto;
  return out;
}

const httpService = {
  list: () => backendClient.get('/api/v1/trips').then((rows) => rows.map(normalize)),
  getById: (id) => backendClient.get(`/api/v1/trips/${id}`).then(normalize),
  create: (data) => backendClient.post('/api/v1/trips', serialize(data)).then(normalize),
  update: (id, data) => backendClient.put(`/api/v1/trips/${id}`, serialize(data)).then(normalize),
  remove: (id) => backendClient.delete(`/api/v1/trips/${id}`),
};

export const tripsRepository = USE_BACKEND ? httpService : tripsCache;
