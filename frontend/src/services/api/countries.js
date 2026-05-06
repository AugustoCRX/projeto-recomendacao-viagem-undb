import { request, backendClient } from './index';
import { REST_COUNTRIES_BASE_URL } from '../../constants';

const FIELDS = [
  'name', 'capital', 'flags', 'population', 'languages', 'currencies',
  'timezones', 'region', 'subregion', 'area', 'idd', 'car', 'tld',
].join(',');

// Backend proxy — returns a single object (backend already dedupes the array).
// Cached 24h server-side.
export function getCountryViaProxy(name) {
  return backendClient.get('/api/v1/external/country', { name });
}

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
