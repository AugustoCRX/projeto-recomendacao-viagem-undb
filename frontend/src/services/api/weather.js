import { request } from './index';
import { OPENWEATHER_BASE_URL } from '../../constants';

const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;

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
