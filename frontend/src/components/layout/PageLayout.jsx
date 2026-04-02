import { Header } from './Header';
import styles from './PageLayout.module.css';

export function PageLayout({ children }) {
  return (
    <div className={styles.root}>
      <Header />
      <main className={styles.main}>{children}</main>
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className={styles.pageHeader}>
      <div>
        <h1 className={styles.pageTitle}>{title}</h1>
        {subtitle && <p className={styles.pageSubtitle}>{subtitle}</p>}
      </div>
      {actions && <div>{actions}</div>}
    </div>
  );
}
