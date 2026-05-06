import { request, backendClient } from './index';
import { OPENWEATHER_BASE_URL } from '../../constants';

const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;

// Returns { current, forecast } — same shapes as the direct OWM endpoints,
// just wrapped together and cached server-side for 30 min.
export function getWeatherViaProxy(city) {
  return backendClient.get('/api/v1/external/weather', { city });
}

export function getWeatherByCity(city) {
  return request(OPENWEATHER_BASE_URL, '/weather', {
    params: { q: city, appid: API_KEY, units: 'metric', lang: 'pt_br' },
  });
}

export function getForecastByCity(city) {
  return request(OPENWEATHER_BASE_URL, '/forecast', {
    params: { q: city, appid: API_KEY, units: 'metric', lang: 'pt_br' },
  });
}
