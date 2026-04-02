// Central API client setup.
// Each external integration gets its own file here (weather.js, places.js, etc.)
// and imports the configured client from this file.

import { API_BASE_URL } from '../../constants';

const defaultHeaders = {
  'Content-Type': 'application/json',
};

async function request(baseURL, path, options = {}) {
  const { method = 'GET', headers = {}, body, params } = options;

  let url = `${baseURL}${path}`;

  if (params) {
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v != null))
    );
    url = `${url}?${query}`;
  }

  const response = await fetch(url, {
    method,
    headers: { ...defaultHeaders, ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message ?? `Request failed: ${response.status}`);
  }

  return response.json();
}

// Pre-configured client for our own backend
export const backendClient = {
  get: (path, params) => request(API_BASE_URL, path, { params }),
  post: (path, body) => request(API_BASE_URL, path, { method: 'POST', body }),
  put: (path, body) => request(API_BASE_URL, path, { method: 'PUT', body }),
  delete: (path) => request(API_BASE_URL, path, { method: 'DELETE' }),
};

export { request };
