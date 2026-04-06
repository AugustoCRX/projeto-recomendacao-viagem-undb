// Busca uma foto representativa do destino usando Unsplash.
// Fallback: gradient baseado no nome do destino (sem chamar API).

import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks';
import { searchPhotos } from '@/services/api/unsplash';

const FALLBACK_GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
];

function getFallbackGradient(seed) {
  const index = seed
    ? seed.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) %
      FALLBACK_GRADIENTS.length
    : 0;
  return FALLBACK_GRADIENTS[index];
}

// Tenta queries em ordem; retorna a melhor foto (maior likes) da primeira que retornar resultados
async function findBestPhoto(destination) {
  const queries = [
    `${destination} landmark famous`,
    `${destination} cityscape`,
    `${destination}`,
  ];
  for (const query of queries) {
    const data = await searchPhotos(query);
    const results = data.results ?? [];
    if (results.length) {
      const best = results.reduce((a, b) => (b.likes > a.likes ? b : a));
      return { type: 'image', value: best.urls.regular, alt: best.alt_description };
    }
  }
  return null;
}

const HAS_UNSPLASH_KEY = Boolean(import.meta.env.VITE_UNSPLASH_ACCESS_KEY);

export function useDestinationPhoto(destination) {
  const debouncedDestination = useDebounce(destination, 600);
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!debouncedDestination) {
      setPhoto(null);
      return;
    }

    if (!HAS_UNSPLASH_KEY) {
      setPhoto({ type: 'gradient', value: getFallbackGradient(debouncedDestination) });
      return;
    }

    let active = true;
    setLoading(true);

    findBestPhoto(debouncedDestination)
      .then((result) => {
        if (!active) return;
        setPhoto(result ?? { type: 'gradient', value: getFallbackGradient(debouncedDestination) });
      })
      .catch(() => {
        if (active) setPhoto({ type: 'gradient', value: getFallbackGradient(debouncedDestination) });
      })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [debouncedDestination]);

  return { photo, loading, fallback: getFallbackGradient(destination) };
}
