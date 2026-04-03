// Mirrors públicos do Overpass API — tenta em ordem até um funcionar
const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.karte.io/api/interpreter',
];

const RADIUS = 3000; // metros
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas

function buildQuery(lat, lng) {
  return `
[out:json][timeout:30];
(
  node["tourism"~"attraction|museum|viewpoint|gallery|zoo|theme_park|artwork"](around:${RADIUS},${lat},${lng});
  node["historic"~"monument|castle|ruins|memorial|pillory"](around:${RADIUS},${lat},${lng});
  node["leisure"~"park|garden"](around:${RADIUS},${lat},${lng});
  node["amenity"~"restaurant|cafe|fast_food|bar|pub"](around:${RADIUS},${lat},${lng});
  node["tourism"~"hotel|hostel|guest_house|motel|apartment"](around:${RADIUS},${lat},${lng});
);
out body 80;
  `.trim();
}

function categorize(tags) {
  const amenity = tags.amenity ?? '';
  const tourism = tags.tourism ?? '';
  if (/restaurant|cafe|fast_food|bar|pub/.test(amenity)) return 'restaurant';
  if (/hotel|hostel|guest_house|motel|apartment/.test(tourism)) return 'lodging';
  return 'tourist_attraction';
}

function normalize(element) {
  const tags = element.tags ?? {};
  const name = tags.name || tags['name:pt'] || tags['name:en'];
  if (!name) return null;
  const address = [tags['addr:street'], tags['addr:housenumber']]
    .filter(Boolean)
    .join(', ') || null;
  return {
    id: `osm-${element.id}`,
    name,
    type: categorize(tags),
    address,
    lat: element.lat,
    lng: element.lon,
    website: tags.website ?? tags['contact:website'] ?? null,
    openingHours: tags.opening_hours ?? null,
  };
}

// Cache em localStorage com TTL
function cacheKey(lat, lng) {
  return `pv_overpass_${lat.toFixed(3)}_${lng.toFixed(3)}`;
}

function readCache(lat, lng) {
  try {
    const raw = localStorage.getItem(cacheKey(lat, lng));
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL_MS) { localStorage.removeItem(cacheKey(lat, lng)); return null; }
    return data;
  } catch { return null; }
}

function writeCache(lat, lng, data) {
  try {
    localStorage.setItem(cacheKey(lat, lng), JSON.stringify({ ts: Date.now(), data }));
  } catch { /* quota exceeded — ignora */ }
}

async function fetchFromEndpoint(endpoint, query) {
  const res = await fetch(endpoint, {
    method: 'POST',
    body: `data=${encodeURIComponent(query)}`,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  if (!res.ok) throw new Error(`${res.status}`);
  const json = await res.json();
  return json.elements ?? [];
}

export async function getAllPlaces(lat, lng) {
  // Retorna cache se disponível
  const cached = readCache(lat, lng);
  if (cached) return cached;

  const query = buildQuery(lat, lng);
  let lastError;

  for (const endpoint of ENDPOINTS) {
    try {
      const elements = await fetchFromEndpoint(endpoint, query);
      const grouped = { tourist_attraction: [], restaurant: [], lodging: [] };
      for (const el of elements) {
        const place = normalize(el);
        if (!place) continue;
        if (grouped[place.type].length < 20) grouped[place.type].push(place);
      }
      writeCache(lat, lng, grouped);
      return grouped;
    } catch (err) {
      lastError = err;
      // Tenta próximo mirror
    }
  }

  throw new Error(`Todos os servidores falharam: ${lastError?.message}`);
}
