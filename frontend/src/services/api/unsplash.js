import { request } from './index';
import { UNSPLASH_BASE_URL } from '../../constants';

const ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;

const headers = { Authorization: `Client-ID ${ACCESS_KEY}` };

export function searchPhotos(query, perPage = 12) {
  return request(UNSPLASH_BASE_URL, '/search/photos', {
    params: { query, per_page: perPage },
    headers,
  });
}
