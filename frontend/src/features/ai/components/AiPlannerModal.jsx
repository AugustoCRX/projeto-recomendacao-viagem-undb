import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button, Spinner } from '@/components/ui';
import { useAiPlanner } from '../hooks/useAiPlanner';
import { ROUTES } from '@/constants';
import { formatDate } from '@/utils';
import styles from './AiPlannerModal.module.css';

// ── Sub-components ─────────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className={styles.loadingBody}>
      <div className={styles.loadingOrb}>
        <Spinner size="lg" />
      </div>
      <p className={styles.loadingTitle}>Gerando seu roteiro personalizado…</p>
      <p className={styles.loadingSubtitle}>
        A IA está consultando clima, dados do destino e seus lugares favoritos.
        <br />Isso pode levar alguns segundos.
      </p>
    </div>
  );
}

function IdleState({ trip, preferences, setPreferences, persist, setPersist, textareaRef, onGenerate, onClose, error }) {
  const hasRequiredDates = trip.startDate && trip.endDate;

  return (
    <div className={styles.body}>
      {!hasRequiredDates && (
        <div className={styles.warningBanner}>
          ⚠️ A viagem precisa ter datas de início e retorno definidas para gerar um roteiro.
        </div>
      )}

      <div className={styles.tripSummary}>
        <span className={styles.tripSummaryIcon}>📍</span>
        <div>
          <p className={styles.tripSummaryDest}>
            {trip.destination}{trip.country ? `, ${trip.country}` : ''}
          </p>
          {hasRequiredDates && (
            <p className={styles.tripSummaryDates}>
              {formatDate(trip.startDate)} → {formatDate(trip.endDate)}
            </p>
          )}
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>
          Preferências <span className={styles.optional}>(opcional)</span>
        </label>
        <textarea
          ref={textareaRef}
          className={styles.textarea}
          rows={4}
          placeholder="Ex: prefiro museus e gastronomia local, orçamento moderado, evitar muita caminhada, incluir parques e natureza…"
          value={preferences}
          onChange={(e) => setPreferences(e.target.value)}
          maxLength={1000}
          disabled={!hasRequiredDates}
        />
        <span className={styles.charCount}>{preferences.length}/1000</span>
      </div>

      <label className={styles.checkboxRow}>
        <input
          type="checkbox"
          className={styles.checkbox}
          checked={persist}
          onChange={(e) => setPersist(e.target.checked)}
          disabled={!hasRequiredDates}
        />
        <span className={styles.checkboxLabel}>Salvar atividades automaticamente no roteiro</span>
      </label>

      {error && <p className={styles.errorMsg}>{error}</p>}

      <div className={styles.actions}>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button onClick={onGenerate} disabled={!hasRequiredDates}>
          ✨ Gerar roteiro
        </Button>
      </div>
    </div>
  );
}

function DayPreview({ day, index }) {
  const [open, setOpen] = useState(index === 0);

  return (
    <div className={styles.dayBlock}>
      <button className={styles.dayToggle} onClick={() => setOpen((o) => !o)}>
        <span className={styles.dayBadge}>Dia {index + 1}</span>
        <span className={styles.dayDate}>{formatDate(day.date)}</span>
        <span className={styles.dayChevron}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <ul className={styles.activityList}>
          {(day.activities ?? []).map((act, i) => (
            <li key={i} className={styles.activityItem}>
              {act.time && <span className={styles.activityTime}>{act.time}</span>}
              <div>
                <p className={styles.activityTitle}>{act.title}</p>
                {act.description && (
                  <p className={styles.activityDesc}>{act.description}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ResultState({ result, itineraryUrl, onRegenerate }) {
  const savedCount = result.saved_items?.length ?? 0;
  const days = result.plan ?? [];

  return (
    <div className={styles.body}>
      <div className={styles.successBanner}>
        <span className={styles.successIcon}>✅</span>
        <div>
          <p className={styles.successTitle}>Roteiro gerado com sucesso!</p>
          {savedCount > 0 && (
            <p className={styles.successSubtitle}>
              {savedCount} atividade{savedCount !== 1 ? 's' : ''} salva{savedCount !== 1 ? 's' : ''} no roteiro.
            </p>
          )}
        </div>
      </div>

      <div className={styles.planPreview}>
        {days.map((day, i) => (
          <DayPreview key={day.date ?? i} day={day} index={i} />
        ))}
      </div>

      <div className={styles.actions}>
        <Button variant="ghost" size="sm" onClick={onRegenerate}>
          Gerar novamente
        </Button>
        <Button as={Link} to={itineraryUrl}>
          📅 Ver roteiro completo
        </Button>
      </div>
    </div>
  );
}

// ── Main Modal ─────────────────────────────────────────────────────────────────

export function AiPlannerModal({ trip, onClose }) {
  const [preferences, setPreferences] = useState('');
  const [persist, setPersist] = useState(true);
  const { generate, loading, result, error, reset } = useAiPlanner(trip.id);
  const textareaRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !loading) onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, loading]);

  useEffect(() => {
    if (!loading && !result) textareaRef.current?.focus();
  }, [loading, result]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !loading) onClose();
  };

  const handleRegenerate = () => {
    reset();
  };

  const itineraryUrl = ROUTES.ITINERARY.replace(':id', trip.id);

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label="Roteiro com IA">
        <div className={styles.header}>
          <div className={styles.headerIconWrap}>
            <span className={styles.headerIcon}>✨</span>
          </div>
          <div className={styles.headerText}>
            <h2 className={styles.title}>Roteiro com IA</h2>
            <p className={styles.subtitle}>Gemini Flash · powered by Google</p>
          </div>
          {!loading && (
            <button className={styles.closeBtn} onClick={onClose} aria-label="Fechar">×</button>
          )}
        </div>

        {loading && <LoadingState />}

        {!loading && !result && (
          <IdleState
            trip={trip}
            preferences={preferences}
            setPreferences={setPreferences}
            persist={persist}
            setPersist={setPersist}
            textareaRef={textareaRef}
            onGenerate={() => generate(preferences.trim(), persist)}
            onClose={onClose}
            error={error}
          />
        )}

        {!loading && result && (
          <ResultState
            result={result}
            itineraryUrl={itineraryUrl}
            onRegenerate={handleRegenerate}
          />
        )}
      </div>
    </div>
  );
}
