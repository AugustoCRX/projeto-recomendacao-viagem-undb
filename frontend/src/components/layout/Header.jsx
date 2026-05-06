import { NavLink, Link } from 'react-router-dom';
import { ROUTES } from '@/constants';
import { useAuth } from '@/features/auth/context/AuthContext';
import { cn } from '@/utils';
import styles from './Header.module.css';

export function Header() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <NavLink to={ROUTES.HOME} className={styles.logo}>
          <div className={styles.logoMark}>✈</div>
          <div className={styles.logoText}>
            <span className={styles.logoTitle}>Planejador</span>
            <span className={styles.logoSub}>de Viagens</span>
          </div>
        </NavLink>

        <nav className={styles.nav}>
          {isAuthenticated && (
            <>
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
            </>
          )}

          {isAuthenticated ? (
            <div className={styles.userArea}>
              <Link to={ROUTES.PROFILE} className={styles.userName}>
                {user?.name}
              </Link>
              <button className={styles.logoutBtn} onClick={logout}>
                Sair
              </button>
            </div>
          ) : (
            <NavLink to={ROUTES.LOGIN} className={styles.navLink}>
              Entrar
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  );
}
