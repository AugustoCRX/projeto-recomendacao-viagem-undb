import { request } from './index';
import { REST_COUNTRIES_BASE_URL } from '../../constants';

export function getCountryByName(name) {
  return request(REST_COUNTRIES_BASE_URL, `/name/${encodeURIComponent(name)}`);
}

export function getCountryByCode(code) {
  return request(REST_COUNTRIES_BASE_URL, `/alpha/${code}`);
}
