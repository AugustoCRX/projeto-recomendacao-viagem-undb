import { request } from './index';
import { REST_COUNTRIES_BASE_URL } from '../../constants';

// Apenas os campos que usamos — reduz o payload de ~20KB para ~1KB por país
const FIELDS = [
  'name',
  'capital',
  'flags',
  'population',
  'languages',
  'currencies',
  'timezones',
  'region',
  'subregion',
  'area',
  'idd',
  'car',
  'tld',
].join(',');

export function getCountryByName(name) {
  return request(REST_COUNTRIES_BASE_URL, `/name/${encodeURIComponent(name)}`, {
    params: { fields: FIELDS },
  });
}

export function getCountryByCode(code) {
  return request(REST_COUNTRIES_BASE_URL, `/alpha/${code}`, {
    params: { fields: FIELDS },
  });
}
