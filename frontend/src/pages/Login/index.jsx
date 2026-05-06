import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/AuthContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/constants';
import styles from './Login.module.css';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from ?? ROUTES.TRIPS;

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function setField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Preencha e-mail e senha.');
      return;
    }
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message ?? 'Falha ao entrar. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.formPanel}>
        <div className={styles.card}>
          <div className={styles.brand}>
            <div className={styles.logoMark}>✈</div>
            <h1 className={styles.title}>Entrar</h1>
            <p className={styles.subtitle}>Acesse seu planejador de viagens</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            <Input
              label="E-mail"
              type="email"
              placeholder="voce@email.com"
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
              required
              autoComplete="email"
            />
            <Input
              label="Senha"
              type="password"
              placeholder="Sua senha"
              value={form.password}
              onChange={(e) => setField('password', e.target.value)}
              required
              autoComplete="current-password"
            />

            {error && <p className={styles.errorMsg}>{error}</p>}

            <Button type="submit" fullWidth disabled={loading}>
              {loading ? 'Entrando…' : 'Entrar'}
            </Button>
          </form>

          <p className={styles.footer}>
            Não tem uma conta?{' '}
            <Link to={ROUTES.REGISTER} className={styles.link}>
              Criar conta
            </Link>
          </p>
        </div>
      </div>

      <div className={styles.imagePanel} aria-hidden="true" />
    </div>
  );
}
