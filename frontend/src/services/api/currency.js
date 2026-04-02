import { request } from './index';
import { EXCHANGERATE_BASE_URL } from '../../constants';

const API_KEY = import.meta.env.VITE_EXCHANGERATE_API_KEY;

export function getExchangeRates(baseCurrency) {
  return request(EXCHANGERATE_BASE_URL, `/${API_KEY}/latest/${baseCurrency}`);
}
