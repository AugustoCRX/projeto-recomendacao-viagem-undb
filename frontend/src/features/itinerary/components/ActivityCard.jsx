import { ACTIVITY_TYPES } from '../constants';
import styles from './ActivityCard.module.css';

export function ActivityCard({ activity, dayId, onRemove, onEdit }) {
  const type = ACTIVITY_TYPES[activity.type] ?? ACTIVITY_TYPES.free;

  return (
    <div className={styles.card}>
      <span className={`${styles.typeIcon} ${styles[activity.type] ?? styles.free}`}>
        {type.icon}
      </span>

      <div className={styles.body}>
        {activity.time && <p className={styles.time}>{activity.time}</p>}
        <p className={styles.title}>{activity.title}</p>
        {activity.notes && <p className={styles.notes}>{activity.notes}</p>}
      </div>

      <div className={styles.actions}>
        <button
          className={styles.editBtn}
          onClick={() => onEdit(activity)}
          title="Editar atividade"
        >
          ✏️
        </button>
        <button
          className={styles.deleteBtn}
          onClick={() => onRemove(dayId, activity.id)}
          title="Remover atividade"
        >
          ×
        </button>
      </div>
    </div>
  );
}
