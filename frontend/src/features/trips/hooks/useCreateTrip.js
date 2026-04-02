import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { tripsRepository } from '../services/trips';
import { ROUTES } from '@/constants';

const INITIAL_FORM = {
  name: '',
  destination: '',
  country: '',
  startDate: '',
  endDate: '',
  budget: '',
  currency: 'BRL',
  status: 'planning',
  notes: '',
};

function validate(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = 'Nome da viagem é obrigatório';
  if (!form.destination.trim()) errors.destination = 'Destino é obrigatório';
  if (!form.startDate) errors.startDate = 'Data de início é obrigatória';
  if (!form.endDate) errors.endDate = 'Data de retorno é obrigatória';
  if (form.startDate && form.endDate && form.startDate > form.endDate) {
    errors.endDate = 'Data de retorno deve ser após a data de início';
  }
  if (form.budget && isNaN(Number(form.budget))) {
    errors.budget = 'Orçamento deve ser um número';
  }
  return errors;
}

export function useCreateTrip() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const submit = async () => {
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      const trip = await tripsRepository.create({
        ...form,
        budget: form.budget ? Number(form.budget) : null,
      });
      navigate(ROUTES.TRIP_DETAIL.replace(':id', trip.id));
    } catch (err) {
      setErrors({ submit: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return { form, errors, submitting, setField, submit };
}
