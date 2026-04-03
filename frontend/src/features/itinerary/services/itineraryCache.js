const key = (tripId) => `pv_itinerary_${tripId}`;

function generateDays(trip) {
  const days = [];
  const start = new Date(`${trip.startDate}T12:00:00`);
  const end = new Date(`${trip.endDate}T12:00:00`);

  for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push({
      id: `day-${days.length + 1}`,
      date: d.toISOString().split('T')[0],
      dayNumber: days.length + 1,
      activities: [],
    });
  }

  return days;
}

function load(tripId) {
  try {
    const raw = localStorage.getItem(key(tripId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function save(tripId, days) {
  localStorage.setItem(key(tripId), JSON.stringify(days));
}

export const itineraryCache = {
  getOrInit(trip) {
    const existing = load(trip.id);
    if (existing) return Promise.resolve(existing);
    const days = generateDays(trip);
    save(trip.id, days);
    return Promise.resolve(days);
  },

  addActivity(tripId, dayId, activity) {
    const days = load(tripId) ?? [];
    const day = days.find((d) => d.id === dayId);
    if (!day) return Promise.reject(new Error('Dia não encontrado'));

    day.activities.push({
      ...activity,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    });

    // Mantém ordenação por horário
    day.activities.sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''));
    save(tripId, days);
    return Promise.resolve(days);
  },

  removeActivity(tripId, dayId, activityId) {
    const days = load(tripId) ?? [];
    const day = days.find((d) => d.id === dayId);
    if (day) {
      day.activities = day.activities.filter((a) => a.id !== activityId);
      save(tripId, days);
    }
    return Promise.resolve(days);
  },

  updateActivity(tripId, dayId, activityId, updates) {
    const days = load(tripId) ?? [];
    const day = days.find((d) => d.id === dayId);
    if (!day) return Promise.reject(new Error('Dia não encontrado'));
    const idx = day.activities.findIndex((a) => a.id === activityId);
    if (idx === -1) return Promise.reject(new Error('Atividade não encontrada'));
    day.activities[idx] = { ...day.activities[idx], ...updates };
    day.activities.sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''));
    save(tripId, days);
    return Promise.resolve(days);
  },
};
