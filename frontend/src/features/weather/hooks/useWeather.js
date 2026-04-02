import { useState, useEffect } from 'react';
import { getWeatherByCity } from '../../../services/api/weather';

export function useWeather(city) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!city) return;
    setLoading(true);
    getWeatherByCity(city)
      .then(setWeather)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [city]);

  return { weather, loading, error };
}
