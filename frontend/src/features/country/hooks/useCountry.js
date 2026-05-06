import { useState, useEffect } from 'react';
import { getCountryByName, getCountryViaProxy } from '@/services/api/countries';

const USE_BACKEND = import.meta.env.VITE_USE_BACKEND === 'true';

function normalize(raw) {
  const currencies = Object.entries(raw.currencies ?? {});
  const mainCurrency = currencies[0];
  const languages = Object.values(raw.languages ?? {});
  const root = raw.idd?.root ?? '';
  const suffix = raw.idd?.suffixes?.[0] ?? '';
  const phonePrefix = root && suffix ? `${root}${suffix}` : null;
  const populationFormatted = new Intl.NumberFormat('pt-BR').format(raw.population ?? 0);
  const areaFormatted = new Intl.NumberFormat('pt-BR').format(Math.round(raw.area ?? 0));

  return {
    name: raw.name?.common ?? '',
    officialName: raw.name?.official ?? '',
    capital: raw.capital?.[0] ?? null,
    flag: {
      src: raw.flags?.svg ?? raw.flags?.png ?? '',
      alt: raw.flags?.alt ?? `Bandeira de ${raw.name?.common}`,
    },
    population: populationFormatted,
    languages,
    currency: mainCurrency
      ? { code: mainCurrency[0], name: mainCurrency[1].name, symbol: mainCurrency[1].symbol }
      : null,
    timezones: raw.timezones ?? [],
    mainTimezone: raw.timezones?.[0] ?? null,
    region: raw.region ?? null,
    subregion: raw.subregion ?? null,
    area: areaFormatted,
    phonePrefix,
    drivingSide: raw.car?.side ?? null,
    tld: raw.tld?.[0] ?? null,
  };
}

export function useCountry(countryName) {
  const [country, setCountry] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!countryName) return;

    setLoading(true);
    setError(null);
    setCountry(null);

    const fetch = USE_BACKEND
      ? getCountryViaProxy(countryName).then((data) => setCountry(normalize(data)))
      : getCountryByName(countryName).then((data) => {
          const raw = Array.isArray(data) ? data[0] : data;
          setCountry(normalize(raw));
        });

    fetch
      .catch(() => setError('País não encontrado'))
      .finally(() => setLoading(false));
  }, [countryName]);

  return { country, loading, error };
}
