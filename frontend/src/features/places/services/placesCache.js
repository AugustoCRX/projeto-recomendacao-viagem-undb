// Mock de lugares por tipo.
// Retorna dados realistas quando a API do Google Places não está disponível.

// Offsets em graus (~100-500m) para espalhar marcadores no mapa
const OFFSETS = [
  [0.003, 0.005], [-0.004, 0.002], [0.006, -0.003], [-0.002, -0.006],
  [0.005, 0.004], [-0.006, 0.001], [0.001, -0.005], [-0.003, 0.007], [0.007, -0.002],
];

const MOCK_PLACES = {
  tourist_attraction: [
    { id: 'm1', name: 'Catedral Histórica', type: 'tourist_attraction', rating: 4.7, address: 'Centro Histórico', description: 'Arquitetura imponente do século XVIII.', photoUrl: null, _offsetIdx: 0 },
    { id: 'm2', name: 'Museu Nacional de Arte', type: 'tourist_attraction', rating: 4.5, address: 'Av. das Artes, 100', description: 'Acervo com obras dos séculos XIX e XX.', photoUrl: null, _offsetIdx: 1 },
    { id: 'm3', name: 'Mirante da Cidade', type: 'tourist_attraction', rating: 4.8, address: 'Morro Central', description: 'Vista panorâmica 360° da cidade.', photoUrl: null, _offsetIdx: 2 },
    { id: 'm4', name: 'Jardim Botânico', type: 'tourist_attraction', rating: 4.6, address: 'Parque Verde, s/n', description: 'Mais de 2.000 espécies de plantas.', photoUrl: null, _offsetIdx: 3 },
  ],
  restaurant: [
    { id: 'm5', name: 'Restaurante Tradicional', type: 'restaurant', rating: 4.4, address: 'Rua do Mercado, 22', description: 'Culinária local autêntica desde 1952.', photoUrl: null, _offsetIdx: 4 },
    { id: 'm6', name: 'Café do Centro', type: 'restaurant', rating: 4.3, address: 'Praça Principal, 5', description: 'Cafés especiais e pastéis artesanais.', photoUrl: null, _offsetIdx: 5 },
    { id: 'm7', name: 'Bistrô Moderno', type: 'restaurant', rating: 4.6, address: 'Rua das Flores, 89', description: 'Fusão de gastronomia local e internacional.', photoUrl: null, _offsetIdx: 6 },
  ],
  lodging: [
    { id: 'm8', name: 'Hotel Central', type: 'lodging', rating: 4.2, address: 'Av. Principal, 300', description: 'Excelente localização e café da manhã incluso.', photoUrl: null, _offsetIdx: 7 },
    { id: 'm9', name: 'Pousada Charmosa', type: 'lodging', rating: 4.5, address: 'Rua Histórica, 14', description: 'Ambiente aconchegante em casarão restaurado.', photoUrl: null, _offsetIdx: 8 },
  ],
};

export function attachCoords(places, center) {
  if (!center) return places;
  return places.map((p) => {
    const [dLat, dLng] = OFFSETS[p._offsetIdx ?? 0];
    return { ...p, lat: center.lat + dLat, lng: center.lng + dLng };
  });
}

export const placesCache = {
  getByType(type = 'tourist_attraction') {
    const places = MOCK_PLACES[type] ?? MOCK_PLACES.tourist_attraction;
    return Promise.resolve(places);
  },

  getAll() {
    const all = Object.values(MOCK_PLACES).flat();
    return Promise.resolve(all);
  },
};
