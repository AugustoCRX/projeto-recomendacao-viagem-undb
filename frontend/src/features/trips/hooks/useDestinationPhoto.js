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

    setLoading(true);
    searchPhotos(`${debouncedDestination} travel`, 1)
      .then((data) => {
        const result = data.results?.[0];
        if (result) {
          setPhoto({ type: 'image', value: result.urls.regular, alt: result.alt_description });
        } else {
          setPhoto({ type: 'gradient', value: getFallbackGradient(debouncedDestination) });
        }
      })
      .catch(() => {
        setPhoto({ type: 'gradient', value: getFallbackGradient(debouncedDestination) });
      })
      .finally(() => setLoading(false));
  }, [debouncedDestination]);

  return { photo, loading, fallback: getFallbackGradient(destination) };
}
