import styles from './PlaceCard.module.css';

const TYPE_ICON = {
  tourist_attraction: '🏛️',
  restaurant: '🍽️',
  lodging: '🏨',
  park: '🌳',
  museum: '🖼️',
  shopping_mall: '🛍️',
};

export function PlaceCard({ place, isMock = false }) {
  const icon = TYPE_ICON[place.type] ?? '📍';

  return (
    <div className={styles.card}>
      <span className={styles.icon}>{icon}</span>
      <div className={styles.content}>
        <p className={styles.name}>{place.name}</p>
        {place.address && <p className={styles.address}>{place.address}</p>}
        {place.description && <p className={styles.description}>{place.description}</p>}
        <div className={styles.rating}>
          ★ {place.rating?.toFixed(1) ?? '—'}
          {isMock && <span className={styles.mockBadge}>(dados de exemplo)</span>}
        </div>
      </div>
    </div>
  );
}
