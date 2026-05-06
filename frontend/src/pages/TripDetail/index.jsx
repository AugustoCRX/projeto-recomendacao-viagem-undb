import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageLayout } from '@/components/layout';
import { Button, Badge, Spinner } from '@/components/ui';
import { PlaceCard } from '@/features/places/components/PlaceCard';
import { CountryInfo } from '@/features/country/components/CountryInfo';
import { WeatherWidget } from '@/features/weather/components/WeatherWidget';
import { WeatherForecast } from '@/features/weather/components/WeatherForecast';
import { useWeather } from '@/features/weather/hooks/useWeather';
import { useTripDetail } from '@/features/trips/hooks/useTripDetail';
import { useDestinationPhoto } from '@/features/trips/hooks/useDestinationPhoto';
import { usePlacesByDestination } from '@/features/places/hooks/usePlacesByDestination';
import { AiPlannerModal } from '@/features/ai/components/AiPlannerModal';
import { useSavedPlaces } from '@/features/places/hooks/useSavedPlaces';
import { CurrencyConverter } from '@/features/currency/components/CurrencyConverter';
import { ROUTES } from '@/constants';
import { formatDate, formatCurrency, daysBetween } from '@/utils';
import styles from './TripDetail.module.css';

const USE_BACKEND = import.meta.env.VITE_USE_BACKEND === 'true';

const PLACE_TYPES = [
  { label: '🏛️ Atrações', value: 'tourist_attraction' },
  { label: '🍽️ Restaurantes', value: 'restaurant' },
  { label: '🏨 Hospedagem', value: 'lodging' },
];

export default function TripDetailPage() {
  const { id } = useParams();
  const { trip, loading, error } = useTripDetail(id);
  const { photo, fallback } = useDestinationPhoto(trip?.destination);
  const [placeType, setPlaceType] = useState('tourist_attraction');
  const [showAiPlanner, setShowAiPlanner] = useState(false);
  const { savedPlaces, isSaved, getSavedId, savePlace, removePlace, pending } = useSavedPlaces(trip?.id);
  const { placesByType, loading: placesLoading } = usePlacesByDestination(trip?.destination);
  const places = placesByType[placeType] ?? [];
  const weather = useWeather(trip?.destination);

  if (loading) return <PageLayout><Spinner center /></PageLayout>;

  if (error || !trip) {
    return (
      <PageLayout>
        <p>Viagem não encontrada.</p>
        <Button as={Link} to={ROUTES.TRIPS} variant="secondary">
          Voltar para minhas viagens
        </Button>
      </PageLayout>
    );
  }

  const coverStyle = trip.coverPhoto
    ? { backgroundImage: `url(${trip.coverPhoto})` }
    : photo?.type === 'image'
    ? { backgroundImage: `url(${photo.value})` }
    : { background: photo?.value ?? fallback };

  const days =
    trip.startDate && trip.endDate
      ? daysBetween(trip.startDate, trip.endDate)
      : null;

  // Usa o país da viagem como fonte principal; cai no destino como fallback
  const countryQuery = trip.country || trip.destination;

  return (
    <PageLayout>
      <div className={styles.backBtn}>
        <Button as={Link} to={ROUTES.TRIPS} variant="ghost" size="sm">
          ← Minhas Viagens
        </Button>
      </div>

      {/* Hero */}
      <div className={styles.hero} style={coverStyle}>
        <div className={styles.heroOverlay}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>{trip.name}</h1>
            <p className={styles.heroSubtitle}>
              📍 {trip.destination}{trip.country ? `, ${trip.country}` : ''}
            </p>
          </div>
        </div>
      </div>

      <div className={styles.layout}>
        {/* Coluna principal */}
        <div>
          {/* Previsão do tempo */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>☁️ Previsão do tempo</h2>
            <WeatherForecast
              forecast={weather.forecast}
              loading={weather.loading}
              noKey={weather.noKey}
              error={weather.error}
            />
          </div>

          {/* Dados do país */}
          {countryQuery && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>🌍 Sobre o país</h2>
              <CountryInfo countryName={countryQuery} />
            </div>
          )}

          {/* Lugares */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              🗺️ O que fazer em {trip.destination}
            </h2>

            <div className={styles.placeTypeTabs}>
              {PLACE_TYPES.map((t) => (
                <button
                  key={t.value}
                  className={`${styles.placeTypeBtn} ${placeType === t.value ? styles.placeTypeBtnActive : ''}`}
                  onClick={() => setPlaceType(t.value)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {placesLoading ? (
              <Spinner center />
            ) : places.length === 0 ? (
              <p className={styles.mockNotice}>Nenhum resultado encontrado para este destino.</p>
            ) : (
              <div className={styles.placesList}>
                {places.map((place) => (
                  <PlaceCard
                    key={place.id}
                    place={place}
                    isSaved={USE_BACKEND ? isSaved(place.id) : undefined}
                    isPending={USE_BACKEND ? pending.has(place.id) : undefined}
                    onSave={USE_BACKEND ? () => savePlace({ name: place.name, address: place.address, lat: place.lat, lng: place.lng, category: place.type, placeId: place.id }) : undefined}
                    onRemove={USE_BACKEND ? () => removePlace(getSavedId(place.id)) : undefined}
                  />
                ))}
              </div>
            )}
          </div>

          {trip.notes && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>📝 Observações</h2>
              <p className={styles.notes}>{trip.notes}</p>
            </div>
          )}

          {USE_BACKEND && savedPlaces.length > 0 && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>📌 Lugares salvos ({savedPlaces.length})</h2>
              <div className={styles.placesList}>
                {savedPlaces.map((saved) => (
                  <PlaceCard
                    key={saved.id}
                    place={{
                      id: saved.place_id ?? saved.id,
                      name: saved.name,
                      address: saved.address,
                      lat: saved.lat ? Number(saved.lat) : null,
                      lng: saved.lng ? Number(saved.lng) : null,
                      type: saved.category,
                    }}
                    isSaved
                    onRemove={() => removePlace(saved.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar — info da viagem */}
        <div>
          <WeatherWidget
            current={weather.current}
            loading={weather.loading}
            noKey={weather.noKey}
            error={weather.error}
          />

          <div className={styles.infoCard}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Status</span>
              <Badge status={trip.status} />
            </div>
            {trip.startDate && (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Início</span>
                <span className={styles.infoValue}>{formatDate(trip.startDate)}</span>
              </div>
            )}
            {trip.endDate && (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Retorno</span>
                <span className={styles.infoValue}>{formatDate(trip.endDate)}</span>
              </div>
            )}
            {days !== null && (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Duração</span>
                <span className={styles.infoValue}>{days} dias</span>
              </div>
            )}
            {trip.budget && (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Orçamento</span>
                <span className={styles.infoValue}>
                  {formatCurrency(trip.budget, trip.currency ?? 'BRL')}
                </span>
              </div>
            )}

            <Button
              as={Link}
              to={ROUTES.ITINERARY.replace(':id', trip.id)}
              variant="secondary"
              fullWidth
            >
              📅 Ver roteiro
            </Button>
            <Button
              as={Link}
              to={ROUTES.MAP.replace(':id', trip.id)}
              variant="secondary"
              fullWidth
            >
              🗺️ Ver no mapa
            </Button>
            {USE_BACKEND && (
              <Button fullWidth onClick={() => setShowAiPlanner(true)}>
                ✨ Gerar roteiro com IA
              </Button>
            )}
          </div>

          {USE_BACKEND && (
            <CurrencyConverter initialFrom={trip.currency ?? 'BRL'} />
          )}
        </div>
      </div>

      {showAiPlanner && (
        <AiPlannerModal trip={trip} onClose={() => setShowAiPlanner(false)} />
      )}
    </PageLayout>
  );
}
