import styles from './Spinner.module.css';
import { cn } from '@/utils';

export function Spinner({ size = 'md', center = false, className }) {
  const spinner = <span className={cn(styles.spinner, styles[size], className)} />;
  if (center) return <div className={styles.center}>{spinner}</div>;
  return spinner;
}
