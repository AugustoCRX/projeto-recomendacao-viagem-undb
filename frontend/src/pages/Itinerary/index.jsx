import { Link, useParams } from 'react-router-dom';
import { PageLayout, PageHeader } from '@/components/layout';
import { Button, Spinner } from '@/components/ui';
import { DayColumn } from '@/features/itinerary/components/DayColumn';
import { useItinerary } from '@/features/itinerary/hooks/useItinerary';
import { useTripDetail } from '@/features/trips/hooks/useTripDetail';
import { placesCache } from '@/features/places/services/placesCache';
import { ROUTES } from '@/constants';
import { daysBetween } from '@/utils';
import { useState, useEffect } from 'react';
import styles from './Itinerary.module.css';

export default function ItineraryPage() {
  const { id } = useParams();
  const { trip, loading: tripLoading } = useTripDetail(id);
  const { days, loading: itineraryLoading, addActivity, removeActivity } = useItinerary(trip);
  const [suggestions, setSuggestions] = useState([]);

  // Carrega sugestões de lugares do destino para o form de atividades
  useEffect(() => {
    if (!trip?.destination) return;
    placesCache.getAll().then(setSuggestions);
  }, [trip?.destination]);

  if (tripLoading || itineraryLoading) {
    return <PageLayout><Spinner center /></PageLayout>;
  }

  if (!trip) {
    return (
      <PageLayout>
        <p>Viagem não encontrada.</p>
        <Button as={Link} to={ROUTES.TRIPS} variant="secondary">Voltar</Button>
      </PageLayout>
    );
  }

  const totalActivities = days.reduce((sum, d) => sum + d.activities.length, 0);
  const tripDays = trip.startDate && trip.endDate
    ? daysBetween(trip.startDate, trip.endDate) + 1
    : 0;

  return (
    <PageLayout>
      <PageHeader
        title={trip.name}
        subtitle={`Roteiro • ${trip.destination}`}
        actions={
          <Button as={Link} to={ROUTES.TRIP_DETAIL.replace(':id', id)} variant="secondary" size="sm">
            ← Voltar ao detalhe
          </Button>
        }
      />

      {!trip.startDate || !trip.endDate ? (
        <div className={styles.noDates}>
          <span className={styles.noDatesIcon}>📅</span>
          <p className={styles.noDatesTitle}>Datas não definidas</p>
          <p className={styles.noDatesSubtitle}>
            Defina as datas da viagem para criar o roteiro por dias.
          </p>
          <Button as={Link} to={ROUTES.TRIP_DETAIL.replace(':id', id)} variant="secondary">
            Editar viagem
          </Button>
        </div>
      ) : (
        <>
          <div className={styles.summary}>
            <span className={styles.summaryItem}>
              🌙 <span className={styles.summaryValue}>{tripDays}</span> dias
            </span>
            <span className={styles.summaryItem}>
              ✅ <span className={styles.summaryValue}>{totalActivities}</span> atividade{totalActivities !== 1 ? 's' : ''} planejada{totalActivities !== 1 ? 's' : ''}
            </span>
          </div>

          <div className={styles.boardWrapper}>
            <div className={styles.board}>
              {days.map((day) => (
                <DayColumn
                  key={day.id}
                  day={day}
                  onAddActivity={addActivity}
                  onRemoveActivity={removeActivity}
                  suggestions={suggestions}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </PageLayout>
  );
}
