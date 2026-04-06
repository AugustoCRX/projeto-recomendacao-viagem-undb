import { useState } from 'react';
import { ACTIVITY_TYPES } from '../constants';
import styles from './ActivityForm.module.css';

const EMPTY = { time: '', type: 'attraction', title: '', notes: '' };

export function ActivityForm({ onSave, onCancel, suggestions = [], initialValues = null }) {
  const [form, setForm] = useState(initialValues ?? EMPTY);

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleSave = () => {
    if (!form.title.trim()) return;
    onSave({ ...form, title: form.title.trim(), notes: form.notes.trim() });
    setForm(EMPTY);
  };

  const applySuggestion = (place) => {
    setForm((f) => ({
      ...f,
      title: place.name,
      type: place.type === 'restaurant' ? 'restaurant'
          : place.type === 'lodging'    ? 'lodging'
          : 'attraction',
    }));
  };

  return (
    <div className={styles.form}>
      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label}>Horário</label>
          <input
            className={styles.input}
            type="time"
            value={form.time}
            onChange={(e) => set('time', e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Tipo</label>
          <select
            className={styles.select}
            value={form.type}
            onChange={(e) => set('type', e.target.value)}
          >
            {Object.entries(ACTIVITY_TYPES).map(([value, { label, icon }]) => (
              <option key={value} value={value}>
                {icon} {label}
              </option>
            ))}
          </select>
        </div>

        <div className={`${styles.field} ${styles.titleInput}`}>
          <label className={styles.label}>Título *</label>
          <input
            className={styles.input}
            placeholder="Ex: Visita ao Museu Nacional"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            autoFocus
          />
        </div>

        <div className={`${styles.field} ${styles.titleInput}`}>
          <label className={styles.label}>Observações</label>
          <input
            className={styles.input}
            placeholder="Endereço, link, preço..."
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
          />
        </div>
      </div>

      {suggestions.length > 0 && (
        <div className={styles.suggestions}>
          <span className={styles.suggestionsLabel}>Sugestões rápidas:</span>
          <div className={styles.suggestionsList}>
            {suggestions.slice(0, 6).map((place) => (
              <button
                key={place.id}
                className={styles.suggestionChip}
                onClick={() => applySuggestion(place)}
              >
                {place.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={styles.actions}>
        <button className={styles.cancelBtn} onClick={onCancel}>
          Cancelar
        </button>
        <button
          className={styles.saveBtn}
          onClick={handleSave}
          disabled={!form.title.trim()}
        >
          Adicionar
        </button>
      </div>
    </div>
  );
}
