import styles from './Badge.module.css';
import { cn } from '@/utils';

const STATUS_LABELS = {
  planning: 'Planejando',
  confirmed: 'Confirmada',
  ongoing: 'Em andamento',
  completed: 'Concluída',
  cancelled: 'Cancelada',
};

export function Badge({ status, className }) {
  return (
    <span className={cn(styles.badge, styles[status], className)}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
