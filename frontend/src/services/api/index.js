// Central API client setup.
// Each external integration gets its own file here (weather.js, places.js, etc.)
// and imports the configured client from this file.

import { API_BASE_URL } from '../../constants';

async function request(baseURL, path, options = {}) {
  const { method = 'GET', headers = {}, body, params } = options;

  let url = `${baseURL}${path}`;

  if (params) {
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v != null))
    );
    url = `${url}?${query}`;
  }

  const baseHeaders = body ? { 'Content-Type': 'application/json' } : {};

  const token = localStorage.getItem('auth_token');
  if (token) baseHeaders['Authorization'] = `Bearer ${token}`;

  const response = await fetch(url, {
    method,
    headers: { ...baseHeaders, ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/login';
    }
    throw new Error(error.detail ?? error.message ?? `Request failed: ${response.status}`);
  }

  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return null;
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
