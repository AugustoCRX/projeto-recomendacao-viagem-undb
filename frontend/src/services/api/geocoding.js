const BASE = 'https://nominatim.openstreetmap.org';

export async function geocodeCity(city) {
  const params = new URLSearchParams({ q: city, format: 'json', limit: 1 });
  const res = await fetch(`${BASE}/search?${params}`, {
    headers: { 'Accept-Language': 'pt-BR,pt;q=0.9' },
  });
  if (!res.ok) throw new Error('Geocoding failed');
  const data = await res.json();
  if (!data.length) throw new Error('Cidade não encontrada');
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}
