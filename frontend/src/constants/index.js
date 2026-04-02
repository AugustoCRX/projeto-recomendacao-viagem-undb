// API base URLs — values come from .env (never hardcode keys here)
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

// External API base URLs
export const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';
export const GOOGLE_PLACES_BASE_URL = 'https://maps.googleapis.com/maps/api/place';
export const REST_COUNTRIES_BASE_URL = 'https://restcountries.com/v3.1';
export const EXCHANGERATE_BASE_URL = 'https://v6.exchangerate-api.com/v6';
export const UNSPLASH_BASE_URL = 'https://api.unsplash.com';
export const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

// App routes
export const ROUTES = {
  HOME: '/',
  TRIPS: '/',
  TRIP_CREATE: '/trips/new',
  TRIP_DETAIL: '/trips/:id',
  ITINERARY: '/trips/:id/itinerary',
  MAP: '/trips/:id/map',
  COMPARATOR: '/compare',
  NOT_FOUND: '*',
};

// Trip status
export const TRIP_STATUS = {
  PLANNING: 'planning',
  CONFIRMED: 'confirmed',
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

// Supported currencies for the converter
export const DEFAULT_CURRENCY = 'BRL';
export const SUPPORTED_CURRENCIES = ['BRL', 'USD', 'EUR', 'GBP', 'JPY', 'ARS'];

// Map defaults
export const MAP_DEFAULT_CENTER = { lat: -14.235, lng: -51.9253 }; // Brazil center
export const MAP_DEFAULT_ZOOM = 4;

// Pagination
export const DEFAULT_PAGE_SIZE = 10;
