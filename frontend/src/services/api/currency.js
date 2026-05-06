import { backendClient } from './index';

export function convertCurrency(from, to, amount) {
  return backendClient.get('/api/v1/external/exchange', { from, to, amount });
}
