// Google Places é chamado via nosso backend (evita expor a chave no frontend
// e contorna as restrições de CORS da API do Google).
// Endpoint esperado: GET /api/places?destination=Lisboa&type=tourist_attraction

import { backendClient } from './index';

export function getPlacesByDestination(destination, type = 'tourist_attraction') {
  return backendClient.get('/api/v1/external/places', { destination, type });
}
