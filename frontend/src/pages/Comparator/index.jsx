import { useState } from 'react';
import { PageLayout, PageHeader } from '@/components/layout';
import { Select, Spinner, Badge } from '@/components/ui';
import { useTrips } from '@/features/trips/hooks/useTrips';
import { useWeather } from '@/features/weather/hooks/useWeather';
import { useCountry } from '@/features/country/hooks/useCountry';
import { useDestinationPhoto } from '@/features/trips/hooks/useDestinationPhoto';
import { formatDate, formatCurrency, daysBetween } from '@/utils';
import styles from './Comparator.module.css';

function TripColumn({ trip, highlight }) {
  const { photo, fallback } = useDestinationPhoto(trip.destination);
  const { current: weather, loading: weatherLoading } = useWeather(trip.destination);
  const { country, loading: countryLoading } = useCountry(trip.country || trip.destination);

  const coverStyle = trip.coverPhoto
    ? { backgroundImage: `url(${trip.coverPhoto})` }
    : photo?.type === 'image'
    ? { backgroundImage: `url(${photo.value})` }
    : { background: photo?.value ?? fallback };

  const days =
    trip.startDate && trip.endDate
      ? daysBetween(trip.startDate, trip.endDate)
      : null;

  return (
    <div className={`${styles.column} ${highlight ? styles.columnHighlight : ''}`}>
      <div className={styles.cover} style={coverStyle}>
        <div className={styles.coverOverlay} />
        <div className={styles.coverContent}>
          <h2 className={styles.tripName}>{trip.name}</h2>
          <p className={styles.tripDestination}>
            📍 {trip.destination}{trip.country ? `, ${trip.country}` : ''}
          </p>
        </div>
        <div className={styles.badgePos}>
          <Badge status={trip.status} />
        </div>
        {highlight && <div className={styles.winnerBadge}>Menor orçamento</div>}
      </div>

      <div className={styles.section}>
        <p className={styles.sectionLabel}>Período</p>
        <p className={styles.sectionValue}>
          {trip.startDate
            ? `${formatDate(trip.startDate)} → ${formatDate(trip.endDate)}`
            : '—'}
        </p>
        {days !== null && (
          <p className={styles.sectionSub}>
            {days} {days === 1 ? 'dia' : 'dias'}
          </p>
        )}
      </div>

      <div className={styles.section}>
        <p className={styles.sectionLabel}>Orçamento</p>
        <p className={styles.sectionValue}>
          {trip.budget ? formatCurrency(trip.budget, trip.currency ?? 'BRL') : '—'}
        </p>
      </div>

      <div className={styles.section}>
        <p className={styles.sectionLabel}>Clima atual</p>
        {weatherLoading ? (
          <Spinner />
        ) : weather ? (
          <div className={styles.weatherRow}>
            <img
              src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
              alt={weather.description}
              className={styles.weatherIcon}
            />
            <div>
              <p className={styles.sectionValue}>{weather.temp}°C</p>
              <p className={styles.sectionSub}>{weather.description}</p>
              <p className={styles.sectionSub}>
                Umidade: {weather.humidity}% &middot; Vento: {weather.windSpeed} km/h
              </p>
            </div>
          </div>
        ) : (
          <p className={styles.sectionMuted}>Indisponível</p>
        )}
      </div>

      <div className={styles.section}>
        <p className={styles.sectionLabel}>País</p>
        {countryLoading ? (
          <Spinner />
        ) : country ? (
          <div className={styles.countryInfo}>
            <img src={country.flag.src} alt={country.flag.alt} className={styles.flag} />
            {country.capital && (
              <p className={styles.sectionSub}>Capital: <strong>{country.capital}</strong></p>
            )}
            {country.languages.length > 0 && (
              <p className={styles.sectionSub}>
                Idioma: <strong>{country.languages.join(', ')}</strong>
              </p>
            )}
            {country.currency && (
              <p className={styles.sectionSub}>
                Moeda: <strong>{country.currency.symbol} {country.currency.code}</strong>
              </p>
            )}
            {country.mainTimezone && (
              <p className={styles.sectionSub}>Fuso: <strong>{country.mainTimezone}</strong></p>
            )}
            <p className={styles.sectionSub}>
              População: <strong>{country.population}</strong>
            </p>
          </div>
        ) : (
          <p className={styles.sectionMuted}>Indisponível</p>
        )}
      </div>
    </div>
  );
}

export default function ComparatorPage() {
  const { trips, loading } = useTrips();
  const [idA, setIdA] = useState('');
  const [idB, setIdB] = useState('');

  const tripA = trips.find((t) => t.id === idA) ?? null;
  const tripB = trips.find((t) => t.id === idB) ?? null;

  const bothHaveBudget = tripA?.budget && tripB?.budget;
  const highlightA = bothHaveBudget ? tripA.budget <= tripB.budget : false;
  const highlightB = bothHaveBudget ? tripB.budget < tripA.budget : false;

  return (
    <PageLayout>
      <PageHeader
        title="Comparar Destinos"
        subtitle="Selecione duas viagens para comparar lado a lado"
      />

      {loading ? (
        <Spinner center />
      ) : (
        <>
          <div className={styles.selectors}>
            <div className={styles.selectorGroup}>
              <Select
                label="Viagem A"
                value={idA}
                onChange={(e) => setIdA(e.target.value)}
              >
                <option value="">Selecione uma viagem…</option>
                {trips
                  .filter((t) => t.id !== idB)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} — {t.destination}
                    </option>
                  ))}
              </Select>
            </div>

            <div className={styles.vs}>VS</div>

            <div className={styles.selectorGroup}>
              <Select
                label="Viagem B"
                value={idB}
                onChange={(e) => setIdB(e.target.value)}
              >
                <option value="">Selecione uma viagem…</option>
                {trips
                  .filter((t) => t.id !== idA)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} — {t.destination}
                    </option>
                  ))}
              </Select>
            </div>
          </div>

          {!tripA || !tripB ? (
            <div className={styles.empty}>
              <p className={styles.emptyIcon}>🗺️</p>
              <p className={styles.emptyTitle}>Pronto para comparar</p>
              <p className={styles.emptySubtitle}>
                Selecione duas viagens acima para ver a comparação lado a lado
              </p>
            </div>
          ) : (
            <div className={styles.columns}>
              <TripColumn trip={tripA} highlight={highlightA} />
              <TripColumn trip={tripB} highlight={highlightB} />
            </div>
          )}
        </>
      )}
    </PageLayout>
  );
}
