// localStorage-based mock store for trips.
// Swap this out by pointing useTrips to tripsService (HTTP) when backend is ready.

const STORAGE_KEY = 'pv_trips';

const SEED_TRIPS = [
  {
    id: '1',
    name: 'Aventura em Lisboa',
    destination: 'Lisboa',
    country: 'Portugal',
    startDate: '2026-06-10',
    endDate: '2026-06-20',
    budget: 5000,
    currency: 'BRL',
    status: 'planning',
    notes: 'Visitar o Castelo de São Jorge e a Torre de Belém.',
    coverPhoto: null,
    createdAt: '2026-04-01T10:00:00.000Z',
  },
  {
    id: '2',
    name: 'Tokyo Experience',
    destination: 'Tokyo',
    country: 'Japan',
    startDate: '2026-09-01',
    endDate: '2026-09-15',
    budget: 12000,
    currency: 'BRL',
    status: 'confirmed',
    notes: 'Shibuya, Akihabara e o Monte Fuji.',
    coverPhoto: null,
    createdAt: '2026-04-01T11:00:00.000Z',
  },
  {
    id: '3',
    name: 'Buenos Aires Clássico',
    destination: 'Buenos Aires',
    country: 'Argentina',
    startDate: '2026-03-15',
    endDate: '2026-03-22',
    budget: 3000,
    currency: 'BRL',
    status: 'completed',
    notes: 'La Boca, San Telmo e shows de tango.',
    coverPhoto: null,
    createdAt: '2026-03-10T09:00:00.000Z',
  },
];

function loadAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_TRIPS));
      return SEED_TRIPS;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_TRIPS;
  }
}

function saveAll(trips) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
}

export const tripsCache = {
  list() {
    return Promise.resolve(loadAll());
  },

  getById(id) {
    const trip = loadAll().find((t) => t.id === id);
    if (!trip) return Promise.reject(new Error('Viagem não encontrada'));
    return Promise.resolve(trip);
  },

  create(data) {
    const trips = loadAll();
    const newTrip = {
      ...data,
      id: crypto.randomUUID(),
      coverPhoto: null,
      createdAt: new Date().toISOString(),
    };
    saveAll([newTrip, ...trips]);
    return Promise.resolve(newTrip);
  },

  update(id, data) {
    const trips = loadAll();
    const index = trips.findIndex((t) => t.id === id);
    if (index === -1) return Promise.reject(new Error('Viagem não encontrada'));
    trips[index] = { ...trips[index], ...data };
    saveAll(trips);
    return Promise.resolve(trips[index]);
  },

  remove(id) {
    const trips = loadAll().filter((t) => t.id !== id);
    saveAll(trips);
    return Promise.resolve();
  },

  updateCoverPhoto(id, photoUrl) {
    return tripsCache.update(id, { coverPhoto: photoUrl });
  },
};
