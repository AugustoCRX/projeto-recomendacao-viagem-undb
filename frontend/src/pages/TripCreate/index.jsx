import { Link } from 'react-router-dom';
import { PageLayout, PageHeader } from '@/components/layout';
import { Button } from '@/components/ui';
import { TripForm } from '@/features/trips/components/TripForm';
import { useCreateTrip } from '@/features/trips/hooks/useCreateTrip';
import { ROUTES } from '@/constants';
import styles from './TripCreate.module.css';

export default function TripCreatePage() {
  const { form, errors, submitting, setField, submit } = useCreateTrip();

  return (
    <PageLayout>
      <div className={styles.wrapper}>
        <PageHeader
          title="Nova Viagem"
          subtitle="Preencha os detalhes para começar a planejar"
          actions={
            <Button as={Link} to={ROUTES.TRIPS} variant="secondary">
              ← Voltar
            </Button>
          }
        />

        <TripForm
          form={form}
          errors={errors}
          submitting={submitting}
          setField={setField}
          onSubmit={submit}
          onCancel={() => window.history.back()}
        />
      </div>
    </PageLayout>
  );
}
