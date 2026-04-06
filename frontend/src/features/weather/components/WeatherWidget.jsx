import styles from './WeatherWidget.module.css';

function iconUrl(code) {
  return `https://openweathermap.org/img/wn/${code}@2x.png`;
}

function SkeletonWidget() {
  return (
    <div className={styles.skeleton}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className={styles.bone} style={{ width: 80, height: 52 }} />
        <div className={styles.bone} style={{ width: 64, height: 64, borderRadius: '50%' }} />
      </div>
      <div className={styles.bone} style={{ width: '55%', height: 12 }} />
      <div style={{ display: 'flex', gap: 24, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.15)' }}>
        <div className={styles.bone} style={{ width: 48, height: 28 }} />
        <div className={styles.bone} style={{ width: 48, height: 28 }} />
      </div>
    </div>
  );
}

// Recebe dados já carregados pelo useWeather do componente pai (TripDetail)
export function WeatherWidget({ current, loading, error, noKey }) {
  if (loading) return <SkeletonWidget />;

  if (noKey) {
    return (
      <div className={styles.placeholder}>
        <span className={styles.placeholderIcon}>🌤️</span>
        <p className={styles.placeholderText}>
          Adicione <code>VITE_OPENWEATHER_API_KEY</code> no <code>.env.local</code> para ver o clima.
        </p>
      </div>
    );
  }

  if (error || !current) return null;

  return (
    <div className={styles.card}>
      <div className={styles.top}>
        <div className={styles.tempBlock}>
          <span className={styles.temp}>{current.temp}°</span>
          <span className={styles.tempRange}>
            {current.tempMax}° / {current.tempMin}°
          </span>
        </div>
        <img
          src={iconUrl(current.icon)}
          alt={current.description}
          className={styles.icon}
        />
      </div>

      <p className={styles.description}>{current.description}</p>

      <div className={styles.meta}>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Umidade</span>
          <span className={styles.metaValue}>💧 {current.humidity}%</span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Vento</span>
          <span className={styles.metaValue}>💨 {current.windSpeed} km/h</span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Sensação</span>
          <span className={styles.metaValue}>🌡️ {current.feelsLike}°</span>
        </div>
      </div>

      <span className={styles.city}>{current.cityName}</span>
    </div>
  );
}
