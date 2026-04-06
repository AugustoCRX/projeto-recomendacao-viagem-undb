import { useState } from 'react';
import { ActivityCard } from './ActivityCard';
import { ActivityForm } from './ActivityForm';
import { cn } from '@/utils';
import styles from './DayColumn.module.css';

const WEEKDAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const MONTHS   = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

function formatHeader(dateStr) {
  const d = new Date(`${dateStr}T12:00:00`);
  return {
    weekday: WEEKDAYS[d.getDay()],
    date: `${d.getDate()} de ${MONTHS[d.getMonth()]}`,
  };
}

function isToday(dateStr) {
  const today = new Date();
  const d = new Date(`${dateStr}T12:00:00`);
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

export function DayColumn({ day, onAddActivity, onRemoveActivity, onUpdateActivity, suggestions }) {
  const [showForm, setShowForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const { weekday, date } = formatHeader(day.date);
  const todayClass = isToday(day.date) ? styles.today : '';

  const handleSave = async (activity) => {
    await onAddActivity(day.id, activity);
    setShowForm(false);
  };

  const handleEdit = (activity) => {
    setShowForm(false);
    setEditingActivity(activity);
  };

  const handleEditSave = async (updated) => {
    await onUpdateActivity(day.id, editingActivity.id, updated);
    setEditingActivity(null);
  };

  return (
    <div className={cn(styles.column, todayClass)}>
      <div className={styles.header}>
        <span className={styles.dayBadge}>Dia {day.dayNumber}</span>
        <p className={styles.date}>{date}</p>
        <p className={styles.weekday}>{weekday}</p>
      </div>

      <div className={styles.activities}>
        {day.activities.length === 0 && !showForm && (
          <p className={styles.empty}>Nenhuma atividade</p>
        )}
        {day.activities.map((activity) =>
          editingActivity?.id === activity.id ? (
            <div key={activity.id} className={styles.formWrapper}>
              <ActivityForm
                initialValues={editingActivity}
                onSave={handleEditSave}
                onCancel={() => setEditingActivity(null)}
                suggestions={suggestions}
              />
            </div>
          ) : (
            <ActivityCard
              key={activity.id}
              activity={activity}
              dayId={day.id}
              onRemove={onRemoveActivity}
              onEdit={handleEdit}
            />
          )
        )}
      </div>

      {showForm ? (
        <div className={styles.formWrapper}>
          <ActivityForm
            onSave={handleSave}
            onCancel={() => setShowForm(false)}
            suggestions={suggestions}
          />
        </div>
      ) : (
        <div className={styles.footer}>
          <button className={styles.addBtn} onClick={() => { setEditingActivity(null); setShowForm(true); }}>
            + Adicionar atividade
          </button>
        </div>
      )}
    </div>
  );
}
