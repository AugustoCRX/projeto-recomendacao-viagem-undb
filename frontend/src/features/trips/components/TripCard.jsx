import { Link } from 'react-router-dom';
import { Badge, Button } from '@/components/ui';
import { ROUTES } from '@/constants';
import { formatDate, formatCurrency, daysBetween } from '@/utils';
import { useDestinationPhoto } from '../hooks/useDestinationPhoto';
import styles from './TripCard.module.css';

export function TripCard({ trip, onRemove }) {
  const { photo, fallback } = useDestinationPhoto(trip.destination);

  const coverStyle = trip.coverPhoto
    ? { backgroundImage: `url(${trip.coverPhoto})` }
    : photo?.type === 'image'
    ? { backgroundImage: `url(${photo.value})` }
    : { background: photo?.value ?? fallback };

  const days =
    trip.startDate && trip.endDate
      ? daysBetween(trip.startDate, trip.endDate)
      : null;

  const detailPath = ROUTES.TRIP_DETAIL.replace(':id', trip.id);

  return (
    <article className={styles.card}>
      <Link to={detailPath} style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className={styles.cover} style={coverStyle}>
          <div className={styles.coverOverlay} />
          <div className={styles.coverContent}>
            <p className={styles.name}>{trip.name}</p>
            <p className={styles.destination}>
              <span>📍</span>
              {trip.destination}{trip.country ? `, ${trip.country}` : ''}
            </p>
          </div>
          <div className={styles.badgePosition}>
            <Badge status={trip.status} />
          </div>
        </div>

        <div className={styles.body}>

          <div className={styles.meta}>
            {trip.startDate && (
              <span className={styles.metaItem}>
                <span>📅</span>
                {formatDate(trip.startDate)}
                {trip.endDate && ` → ${formatDate(trip.endDate)}`}
              </span>
            )}
            {days !== null && (
              <span className={styles.metaItem}>
                <span>🌙</span>
                {days} {days === 1 ? 'dia' : 'dias'}
              </span>
            )}
            {trip.budget && (
              <span className={styles.metaItem}>
                <span>💰</span>
                {formatCurrency(trip.budget, trip.currency ?? 'BRL')}
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className={styles.actions}>
        <Button
          as={Link}
          to={detailPath}
          variant="secondary"
          size="sm"
        >
          Ver detalhes
        </Button>
        {onRemove && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.preventDefault(); onRemove(trip.id); }}
          >
            Excluir
          </Button>
        )}
      </div>
    </article>
  );
}
