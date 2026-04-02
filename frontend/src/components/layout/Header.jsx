import { NavLink } from 'react-router-dom';
import { ROUTES } from '@/constants';
import { cn } from '@/utils';
import styles from './Header.module.css';

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <NavLink to={ROUTES.HOME} className={styles.logo}>
          <span className={styles.logoIcon}>✈️</span>
          Planejador de Viagens
        </NavLink>

        <nav className={styles.nav}>
          <NavLink
            to={ROUTES.TRIPS}
            className={({ isActive }) =>
              cn(styles.navLink, isActive && styles.navLinkActive)
            }
          >
            Minhas Viagens
          </NavLink>
          <NavLink
            to={ROUTES.COMPARATOR}
            className={({ isActive }) =>
              cn(styles.navLink, isActive && styles.navLinkActive)
            }
          >
            Comparar
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
