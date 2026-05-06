import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageLayout } from '@/components/layout';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/features/auth/context/AuthContext';
import { authService } from '@/features/auth/services/auth';
import { ROUTES } from '@/constants';
import styles from './Profile.module.css';

export default function ProfilePage() {
  const { user } = useAuth();

  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  function setField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError('');
    setSuccess(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      setError('Preencha todos os campos.');
      return;
    }
    if (form.newPassword.length < 6) {
      setError('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError('A nova senha e a confirmação não coincidem.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await authService.changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setSuccess(true);
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.message ?? 'Erro ao alterar senha.');
    } finally {
      setLoading(false);
    }
  }

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <PageLayout>
      <div className={styles.backBtn}>
        <Button as={Link} to={ROUTES.TRIPS} variant="ghost" size="sm">
          ← Minhas Viagens
        </Button>
      </div>

      <div className={styles.layout}>
        <div className={styles.userCard}>
          <div className={styles.avatar}>{initials}</div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user?.name}</span>
            <span className={styles.userEmail}>{user?.email}</span>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>🔒 Alterar senha</h2>
          </div>
          <form onSubmit={handleSubmit} className={styles.sectionBody} noValidate>
            <Input
              label="Senha atual"
              type="password"
              placeholder="Digite sua senha atual"
              value={form.currentPassword}
              onChange={(e) => setField('currentPassword', e.target.value)}
              autoComplete="current-password"
            />
            <Input
              label="Nova senha"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={form.newPassword}
              onChange={(e) => setField('newPassword', e.target.value)}
              autoComplete="new-password"
            />
            <Input
              label="Confirmar nova senha"
              type="password"
              placeholder="Repita a nova senha"
              value={form.confirmPassword}
              onChange={(e) => setField('confirmPassword', e.target.value)}
              autoComplete="new-password"
            />

            {error && <p className={styles.errorMsg}>{error}</p>}
            {success && <p className={styles.successMsg}>Senha alterada com sucesso!</p>}

            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando…' : 'Alterar senha'}
            </Button>
          </form>
        </div>
      </div>
    </PageLayout>
  );
}
