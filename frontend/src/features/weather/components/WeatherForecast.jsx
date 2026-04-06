import styles from './WeatherForecast.module.css';

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function iconUrl(code) {
  return `https://openweathermap.org/img/wn/${code}@2x.png`;
}

function formatDayName(dateStr) {
  const d = new Date(`${dateStr}T12:00:00`);
  const today = new Date();
  const isToday =
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth();
  return isToday ? 'Hoje' : DAY_NAMES[d.getDay()];
}

function SkeletonForecast() {
  return (
    <div className={styles.skeletonStrip}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className={styles.skeletonDay}>
          <div className={styles.bone} style={{ width: 32, height: 10 }} />
          <div className={styles.bone} style={{ width: 48, height: 48, borderRadius: '50%' }} />
          <div className={styles.bone} style={{ width: 28, height: 14 }} />
          <div className={styles.bone} style={{ width: 20, height: 11 }} />
        </div>
      ))}
    </div>
  );
}

// Recebe dados já carregados pelo useWeather do componente pai (TripDetail)
export function WeatherForecast({ forecast, loading, noKey, error }) {
  if (noKey || error) return null;
  if (loading) return <SkeletonForecast />;
  if (!forecast.length) return null;

  return (
    <div className={styles.strip}>
      {forecast.map((day) => (
        <div key={day.date} className={styles.day}>
          <span className={styles.dayName}>{formatDayName(day.date)}</span>
          <img
            src={iconUrl(day.icon)}
            alt={day.description}
            className={styles.dayIcon}
          />
          <div className={styles.temps}>
            <span className={styles.tempMax}>{day.tempMax}°</span>
            <span className={styles.tempMin}>{day.tempMin}°</span>
          </div>
          <span className={styles.description}>{day.description}</span>
        </div>
      ))}
    </div>
  );
}
