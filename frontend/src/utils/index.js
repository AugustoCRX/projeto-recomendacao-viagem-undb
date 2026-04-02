// Pure utility functions shared across the app.

/**
 * Formats a date string to pt-BR locale.
 * @param {string|Date} date
 * @param {Intl.DateTimeFormatOptions} options
 */
export function formatDate(date, options = { dateStyle: 'short' }) {
  return new Intl.DateTimeFormat('pt-BR', options).format(new Date(date));
}

/**
 * Formats a number as currency.
 * @param {number} value
 * @param {string} currency - ISO 4217 code (e.g. 'BRL', 'USD')
 */
export function formatCurrency(value, currency = 'BRL') {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value);
}

/**
 * Returns the number of days between two dates.
 */
export function daysBetween(start, end) {
  const ms = new Date(end) - new Date(start);
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

/**
 * Capitalizes the first letter of a string.
 */
export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Builds a helper to join class names conditionally.
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
