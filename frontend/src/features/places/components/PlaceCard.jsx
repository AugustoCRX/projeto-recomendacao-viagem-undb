import styles from './PlaceCard.module.css';

const TYPE_ICON = {
  tourist_attraction: '🏛️',
  restaurant: '🍽️',
  lodging: '🏨',
  park: '🌳',
  museum: '🖼️',
};

export function PlaceCard({ place }) {
  const icon = TYPE_ICON[place.type] ?? '📍';

  return (
    <div className={styles.card}>
      <span className={styles.icon}>{icon}</span>
      <div className={styles.content}>
        <p className={styles.name}>{place.name}</p>
        {place.address && <p className={styles.address}>📍 {place.address}</p>}
        {place.openingHours && <p className={styles.meta}>🕐 {place.openingHours}</p>}
        {place.website && (
          <a
            href={place.website}
            target="_blank"
            rel="noreferrer"
            className={styles.website}
          >
            🔗 Site oficial
          </a>
        )}
      </div>
    </div>
  );
}
