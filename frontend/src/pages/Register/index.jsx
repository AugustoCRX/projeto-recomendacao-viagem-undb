import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/AuthContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/constants';
import styles from './Register.module.css';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function setField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '', general: '' }));
  }

  function validate() {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Nome é obrigatório.';
    if (!form.email.trim()) errs.email = 'E-mail é obrigatório.';
    if (form.password.length < 8) errs.password = 'Mínimo de 8 caracteres.';
    if (form.password !== form.confirm) errs.confirm = 'As senhas não coincidem.';
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setLoading(true);
    try {
      await register(form.name.trim(), form.email.trim(), form.password);
      navigate(ROUTES.TRIPS, { replace: true });
    } catch (err) {
      setErrors({ general: err.message ?? 'Erro ao criar conta. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <div className={styles.logoMark}>✈</div>
          <h1 className={styles.title}>Criar conta</h1>
          <p className={styles.subtitle}>Comece a planejar suas viagens</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <Input
            label="Nome"
            type="text"
            placeholder="Seu nome completo"
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            error={errors.name}
            required
            autoComplete="name"
          />
          <Input
            label="E-mail"
            type="email"
            placeholder="voce@email.com"
            value={form.email}
            onChange={(e) => setField('email', e.target.value)}
            error={errors.email}
            required
            autoComplete="email"
          />
          <Input
            label="Senha"
            type="password"
            placeholder="Mínimo 8 caracteres"
            value={form.password}
            onChange={(e) => setField('password', e.target.value)}
            error={errors.password}
            required
            autoComplete="new-password"
          />
          <Input
            label="Confirmar senha"
            type="password"
            placeholder="Repita a senha"
            value={form.confirm}
            onChange={(e) => setField('confirm', e.target.value)}
            error={errors.confirm}
            required
            autoComplete="new-password"
          />

          {errors.general && <p className={styles.errorMsg}>{errors.general}</p>}

          <Button type="submit" fullWidth disabled={loading}>
            {loading ? 'Criando conta…' : 'Criar conta'}
          </Button>
        </form>

        <p className={styles.footer}>
          Já tem uma conta?{' '}
          <Link to={ROUTES.LOGIN} className={styles.link}>
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
