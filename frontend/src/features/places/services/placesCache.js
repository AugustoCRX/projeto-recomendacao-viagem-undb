// Mock de lugares por tipo.
// Retorna dados realistas quando a API do Google Places não está disponível.

const MOCK_PLACES = {
  tourist_attraction: [
    { id: 'm1', name: 'Catedral Histórica', type: 'tourist_attraction', rating: 4.7, address: 'Centro Histórico', description: 'Arquitetura imponente do século XVIII.', photoUrl: null },
    { id: 'm2', name: 'Museu Nacional de Arte', type: 'tourist_attraction', rating: 4.5, address: 'Av. das Artes, 100', description: 'Acervo com obras dos séculos XIX e XX.', photoUrl: null },
    { id: 'm3', name: 'Mirante da Cidade', type: 'tourist_attraction', rating: 4.8, address: 'Morro Central', description: 'Vista panorâmica 360° da cidade.', photoUrl: null },
    { id: 'm4', name: 'Jardim Botânico', type: 'tourist_attraction', rating: 4.6, address: 'Parque Verde, s/n', description: 'Mais de 2.000 espécies de plantas.', photoUrl: null },
  ],
  restaurant: [
    { id: 'm5', name: 'Restaurante Tradicional', type: 'restaurant', rating: 4.4, address: 'Rua do Mercado, 22', description: 'Culinária local autêntica desde 1952.', photoUrl: null },
    { id: 'm6', name: 'Café do Centro', type: 'restaurant', rating: 4.3, address: 'Praça Principal, 5', description: 'Cafés especiais e pastéis artesanais.', photoUrl: null },
    { id: 'm7', name: 'Bistrô Moderno', type: 'restaurant', rating: 4.6, address: 'Rua das Flores, 89', description: 'Fusão de gastronomia local e internacional.', photoUrl: null },
  ],
  lodging: [
    { id: 'm8', name: 'Hotel Central', type: 'lodging', rating: 4.2, address: 'Av. Principal, 300', description: 'Excelente localização e café da manhã incluso.', photoUrl: null },
    { id: 'm9', name: 'Pousada Charmosa', type: 'lodging', rating: 4.5, address: 'Rua Histórica, 14', description: 'Ambiente aconchegante em casarão restaurado.', photoUrl: null },
  ],
};

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
