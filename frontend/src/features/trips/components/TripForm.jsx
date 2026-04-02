import { Input, Select, Textarea, Button, Spinner } from '@/components/ui';
import { TRIP_STATUS } from '@/constants';
import { useDestinationPhoto } from '../hooks/useDestinationPhoto';
import styles from './TripForm.module.css';

export function TripForm({ form, errors, submitting, setField, onSubmit, onCancel }) {
  const { photo, loading: photoLoading, fallback } = useDestinationPhoto(form.destination);

  const coverStyle = photo?.type === 'image'
    ? { backgroundImage: `url(${photo.value})`, backgroundSize: 'cover' }
    : { background: photo?.value ?? fallback };

  return (
    <div className={styles.form}>
      {/* Preview do destino via Unsplash */}
      <div className={styles.preview} style={form.destination ? coverStyle : {}}>
        {!form.destination && (
          <span className={styles.previewLabel}>
            Digite o destino para ver uma prévia
          </span>
        )}
        {form.destination && photoLoading && <Spinner />}
        {form.destination && !photoLoading && photo?.type === 'image' && (
          <span className={styles.previewLabel}>Foto via Unsplash</span>
        )}
      </div>

      <Input
        label="Nome da viagem"
        required
        placeholder="Ex: Férias em Lisboa"
        value={form.name}
        onChange={(e) => setField('name', e.target.value)}
        error={errors.name}
        className={styles.fullRow}
      />

      <Input
        label="Destino"
        required
        placeholder="Ex: Lisboa"
        value={form.destination}
        onChange={(e) => setField('destination', e.target.value)}
        error={errors.destination}
      />

      <Input
        label="País"
        placeholder="Ex: Portugal"
        value={form.country}
        onChange={(e) => setField('country', e.target.value)}
      />

      <Input
        label="Data de início"
        type="date"
        required
        value={form.startDate}
        onChange={(e) => setField('startDate', e.target.value)}
        error={errors.startDate}
      />

      <Input
        label="Data de retorno"
        type="date"
        required
        value={form.endDate}
        onChange={(e) => setField('endDate', e.target.value)}
        error={errors.endDate}
      />

      <Input
        label="Orçamento (R$)"
        type="number"
        min="0"
        placeholder="Ex: 5000"
        value={form.budget}
        onChange={(e) => setField('budget', e.target.value)}
        error={errors.budget}
      />

      <Select
        label="Status"
        value={form.status}
        onChange={(e) => setField('status', e.target.value)}
      >
        {Object.entries(TRIP_STATUS).map(([, value]) => (
          <option key={value} value={value}>
            {{ planning: 'Planejando', confirmed: 'Confirmada', ongoing: 'Em andamento', completed: 'Concluída', cancelled: 'Cancelada' }[value]}
          </option>
        ))}
      </Select>

      <Textarea
        label="Observações"
        placeholder="Notas, links, ideias..."
        value={form.notes}
        onChange={(e) => setField('notes', e.target.value)}
        className={styles.fullRow}
      />

      {errors.submit && (
        <div className={styles.submitError}>{errors.submit}</div>
      )}

      <div className={styles.actions}>
        {onCancel && (
          <Button variant="secondary" onClick={onCancel} disabled={submitting}>
            Cancelar
          </Button>
        )}
        <Button onClick={onSubmit} disabled={submitting}>
          {submitting ? <Spinner size="sm" /> : null}
          Salvar viagem
        </Button>
      </div>
    </div>
  );
}
