import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageLayout, PageHeader } from '@/components/layout';
import { Button, Spinner } from '@/components/ui';
import { TripCard } from '@/features/trips/components/TripCard';
import { useTrips } from '@/features/trips/hooks/useTrips';
import { ROUTES, TRIP_STATUS } from '@/constants';
import styles from './Home.module.css';

const FILTERS = [
  { label: 'Todas', value: null },
  { label: 'Planejando', value: TRIP_STATUS.PLANNING },
  { label: 'Confirmadas', value: TRIP_STATUS.CONFIRMED },
  { label: 'Em andamento', value: TRIP_STATUS.ONGOING },
  { label: 'Concluídas', value: TRIP_STATUS.COMPLETED },
];

export default function HomePage() {
  const { trips, loading, removeTrip } = useTrips();
  const [activeFilter, setActiveFilter] = useState(null);

  const filtered = activeFilter
    ? trips.filter((t) => t.status === activeFilter)
    : trips;

  return (
    <PageLayout>
      <PageHeader
        title="Minhas Viagens"
        subtitle={`${trips.length} ${trips.length !== 1 ? 'viagens' : 'viagem'} cadastrada${trips.length !== 1 ? 's' : ''}`}
        actions={
          <Button as={Link} to={ROUTES.TRIP_CREATE}>
            + Nova viagem
          </Button>
        }
      />

      {loading ? (
        <Spinner center />
      ) : (
        <>
          <div className={styles.filterBar}>
            {FILTERS.map((f) => (
              <button
                key={f.label}
                className={`${styles.filterBtn} ${activeFilter === f.value ? styles.filterBtnActive : ''}`}
                onClick={() => setActiveFilter(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className={styles.grid}>
            {filtered.length === 0 ? (
              <div className={styles.empty}>
                <div className={styles.emptyIllustration}>🗺️</div>
                <p className={styles.emptyTitle}>
                  {activeFilter ? 'Nenhuma viagem nesta categoria' : 'Nenhuma viagem ainda'}
                </p>
                <p className={styles.emptySubtitle}>
                  {activeFilter
                    ? 'Tente outro filtro ou crie uma nova viagem.'
                    : 'Comece planejando sua próxima aventura!'}
                </p>
                {!activeFilter && (
                  <Button as={Link} to={ROUTES.TRIP_CREATE}>
                    Criar primeira viagem
                  </Button>
                )}
              </div>
            ) : (
              filtered.map((trip) => (
                <TripCard key={trip.id} trip={trip} onRemove={removeTrip} />
              ))
            )}
          </div>
        </>
      )}
    </PageLayout>
  );
}
