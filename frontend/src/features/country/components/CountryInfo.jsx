import { useCountry } from '../hooks/useCountry';
import styles from './CountryInfo.module.css';

function SkeletonLoader() {
  return (
    <div className={styles.skeletonCard}>
      <div className={styles.skeletonHeader}>
        <div className={`${styles.bone} ${styles.skeletonFlag}`} />
        <div className={styles.skeletonLines}>
          <div className={styles.bone} style={{ height: 22, width: '40%' }} />
          <div className={styles.bone} style={{ height: 12, width: '55%' }} />
        </div>
      </div>
      <div className={styles.skeletonGrid}>
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className={styles.skeletonStat}>
            <div className={styles.bone} style={{ width: 32, height: 32, borderRadius: 8 }} />
            <div className={styles.bone} style={{ height: 10, width: '50%' }} />
            <div className={styles.bone} style={{ height: 14, width: '80%' }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ icon, label, value, sub, valueClass }) {
  if (!value) return null;
  return (
    <div className={styles.stat}>
      <span className={styles.statIcon}>{icon}</span>
      <span className={styles.statLabel}>{label}</span>
      <span className={`${styles.statValue} ${valueClass ?? ''}`}>{value}</span>
      {sub && <span className={styles.statSub}>{sub}</span>}
    </div>
  );
}

export function CountryInfo({ countryName }) {
  const { country, loading, error } = useCountry(countryName);

  if (!countryName) return null;
  if (loading) return <SkeletonLoader />;
  if (error || !country) return null;

  const drivingLabel = country.drivingSide === 'right' ? '→ Direita' : '← Esquerda';
  const drivingClass = country.drivingSide === 'right' ? styles.drivingRight : styles.drivingLeft;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        {country.flag.src && (
          <img src={country.flag.src} alt={country.flag.alt} className={styles.flag} />
        )}
        <div className={styles.headerText}>
          <p className={styles.countryName}>{country.name}</p>
          <div className={styles.meta}>
            {country.region && (
              <span className={styles.regionPill}>
                {country.subregion ?? country.region}
              </span>
            )}
            {country.officialName !== country.name && (
              <span className={styles.officialName}>{country.officialName}</span>
            )}
          </div>
        </div>
      </div>

      <div className={styles.grid}>
        <Stat icon="🏛️" label="Capital"      value={country.capital} />
        <Stat icon="👥" label="População"    value={`${country.population} hab.`} />
        <Stat icon="📐" label="Área total"   value={`${country.area} km²`} />

        <Stat
          icon="💵"
          label="Moeda"
          value={country.currency ? `${country.currency.symbol} ${country.currency.name}` : null}
          sub={country.currency?.code}
        />
        <Stat
          icon="🗣️"
          label="Idioma oficial"
          value={country.languages.slice(0, 2).join(', ')}
        />
        <Stat
          icon="🕐"
          label="Fuso horário"
          value={country.mainTimezone}
          sub={country.timezones.length > 1 ? `+${country.timezones.length - 1} zona(s)` : null}
        />

        <Stat icon="📞" label="DDI"        value={country.phonePrefix} />
        <Stat
          icon="🚗"
          label="Lado da via"
          value={country.drivingSide ? drivingLabel : null}
          valueClass={drivingClass}
        />
        <Stat icon="🌐" label="Domínio"    value={country.tld} />
      </div>
    </div>
  );
}
