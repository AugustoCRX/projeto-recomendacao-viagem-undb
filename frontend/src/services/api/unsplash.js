import { request, backendClient } from './index';
import { UNSPLASH_BASE_URL } from '../../constants';

const ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;

const headers = { Authorization: `Client-ID ${ACCESS_KEY}` };

// Backend proxy — returns { total, results: [{ id, url, thumb, alt, author, author_url }] }
// Cached 1h server-side. No API key needed on the frontend.
export function searchPhotosViaProxy(query, perPage = 5) {
  return backendClient.get('/api/v1/external/images', { query, per_page: perPage });
}

// Direct Unsplash — requires VITE_UNSPLASH_ACCESS_KEY on the frontend.
// Returns the full Unsplash response: { total, results: [{ urls, likes, alt_description, ... }] }
export function searchPhotos(query, perPage = 5) {
  return request(UNSPLASH_BASE_URL, '/search/photos', {
    params: { query, per_page: perPage, orientation: 'landscape', order_by: 'relevant', content_filter: 'high' },
    headers,
  });
}
