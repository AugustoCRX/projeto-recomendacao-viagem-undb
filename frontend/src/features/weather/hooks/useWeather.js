import { useState, useEffect } from 'react';
import { getWeatherByCity, getForecastByCity, getWeatherViaProxy } from '@/services/api/weather';

const USE_BACKEND = import.meta.env.VITE_USE_BACKEND === 'true';
const HAS_KEY = USE_BACKEND || Boolean(import.meta.env.VITE_OPENWEATHER_API_KEY);

function normalizeForecast(data) {
  const byDay = {};

  for (const slot of data.list) {
    const day = slot.dt_txt.split(' ')[0];
    if (!byDay[day]) byDay[day] = { temps: [], icons: [], descriptions: [] };
    byDay[day].temps.push(slot.main.temp_min, slot.main.temp_max);
    byDay[day].icons.push(slot.weather[0].icon);
    byDay[day].descriptions.push(slot.weather[0].description);
  }

  return Object.entries(byDay)
    .slice(0, 5)
    .map(([date, d]) => ({
      date,
      tempMin: Math.round(Math.min(...d.temps)),
      tempMax: Math.round(Math.max(...d.temps)),
      icon: d.icons.find((i) => !i.endsWith('n')) ?? d.icons[0],
      description: d.descriptions[0],
    }));
}

function normalizeCurrent(data) {
  return {
    temp: Math.round(data.main.temp),
    feelsLike: Math.round(data.main.feels_like),
    tempMin: Math.round(data.main.temp_min),
    tempMax: Math.round(data.main.temp_max),
    humidity: data.main.humidity,
    windSpeed: Math.round(data.wind.speed * 3.6),
    description: data.weather[0].description,
    icon: data.weather[0].icon,
    cityName: data.name,
  };
}

export function useWeather(city) {
  const [current, setCurrent] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [noKey, setNoKey] = useState(!HAS_KEY);

  useEffect(() => {
    if (!city || !HAS_KEY) return;

    let active = true;
    setLoading(true);
    setError(null);

    const fetch = USE_BACKEND
      ? getWeatherViaProxy(city).then(({ current: c, forecast: f }) => {
          if (!active) return;
          setCurrent(normalizeCurrent(c));
          setForecast(normalizeForecast(f));
        })
      : Promise.all([getWeatherByCity(city), getForecastByCity(city)]).then(
          ([currentData, forecastData]) => {
            if (!active) return;
            setCurrent(normalizeCurrent(currentData));
            setForecast(normalizeForecast(forecastData));
          },
        );

    fetch
      .catch(() => {
        if (!active) return;
        setError('Não foi possível carregar o clima');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [city]);

  return { current, forecast, loading, error, noKey };
}
