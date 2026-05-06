import styles from './PlaceCard.module.css';

const TYPE_ICON = {
  tourist_attraction: '🏛️',
  restaurant: '🍽️',
  lodging: '🏨',
  park: '🌳',
  museum: '🖼️',
};

export function PlaceCard({ place, onSave, onRemove, isSaved, isPending }) {
  const icon = TYPE_ICON[place.type] ?? '📍';
  const showSaveAction = Boolean(onSave || onRemove);

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

      {showSaveAction && (
        <button
          className={`${styles.saveBtn} ${isSaved ? styles.saveBtnSaved : ''}`}
          onClick={isSaved ? onRemove : onSave}
          disabled={isPending}
          title={isSaved ? 'Remover dos lugares salvos' : 'Salvar lugar'}
        >
          {isPending ? '…' : isSaved ? '🔖' : '＋'}
        </button>
      )}
    </div>
  );
}
