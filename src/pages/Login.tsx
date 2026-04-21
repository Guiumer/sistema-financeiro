import { useState } from 'react';
import { TrendingUp, Eye, EyeOff, LogIn, UserPlus, Mail, Lock, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type AuthMode = 'login' | 'register';

export default function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function setField(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: '' }));
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (mode === 'register' && !form.name.trim()) next.name = 'Nome obrigatório.';
    if (!form.email.trim()) next.email = 'E-mail obrigatório.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'E-mail inválido.';
    if (!form.password) next.password = 'Senha obrigatória.';
    else if (mode === 'register' && form.password.length < 6) next.password = 'Mínimo 6 caracteres.';
    if (mode === 'register' && form.password !== form.confirm) next.confirm = 'Senhas não coincidem.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await register(form.name, form.email, form.password);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function switchMode(m: AuthMode) {
    setMode(m);
    setForm({ name: '', email: '', password: '', confirm: '' });
    setErrors({});
    setShowPassword(false);
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f1117',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
    }}>
      {/* Background decorative elements */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,197,94,0.06) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '-20%', left: '-10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)' }} />
      </div>

      <div style={{ width: '100%', maxWidth: 420, position: 'relative' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, background: 'linear-gradient(135deg, #22c55e, #16a34a)', borderRadius: 16, marginBottom: 16, boxShadow: '0 0 40px rgba(34,197,94,0.25)' }}>
            <TrendingUp size={28} color="#fff" />
          </div>
          <h1 style={{ color: '#e2e8f0', fontSize: 24, fontWeight: 700, margin: 0 }}>FinanceApp</h1>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>Controle financeiro pessoal</p>
        </div>

        {/* Card */}
        <div style={{ background: '#1e2130', border: '1px solid #2a2d3e', borderRadius: 16, padding: 32, boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>
          {/* Tabs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, background: '#252840', borderRadius: 10, padding: 4, marginBottom: 28 }}>
            {(['login', 'register'] as AuthMode[]).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                style={{
                  padding: '8px',
                  borderRadius: 7,
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 13,
                  transition: 'all 0.2s',
                  background: mode === m ? '#1e2130' : 'transparent',
                  color: mode === m ? '#e2e8f0' : '#64748b',
                  boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
                }}
              >
                {m === 'login' ? 'Entrar' : 'Criar conta'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {mode === 'register' && (
              <Field label="Nome completo" error={errors.name}>
                <InputIcon icon={<User size={15} />}>
                  <input
                    value={form.name}
                    onChange={e => setField('name', e.target.value)}
                    placeholder="Seu nome"
                    autoComplete="name"
                    style={inputStyle}
                  />
                </InputIcon>
              </Field>
            )}

            <Field label="E-mail" error={errors.email}>
              <InputIcon icon={<Mail size={15} />}>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setField('email', e.target.value)}
                  placeholder="seu@email.com"
                  autoComplete="email"
                  style={inputStyle}
                />
              </InputIcon>
            </Field>

            <Field label="Senha" error={errors.password}>
              <InputIcon icon={<Lock size={15} />} rightAction={
                <button type="button" onClick={() => setShowPassword(s => !s)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 0, display: 'flex' }}>
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              }>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setField('password', e.target.value)}
                  placeholder={mode === 'register' ? 'Mínimo 6 caracteres' : '••••••••'}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  style={inputStyle}
                />
              </InputIcon>
            </Field>

            {mode === 'register' && (
              <Field label="Confirmar senha" error={errors.confirm}>
                <InputIcon icon={<Lock size={15} />}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.confirm}
                    onChange={e => setField('confirm', e.target.value)}
                    placeholder="Repita a senha"
                    autoComplete="new-password"
                    style={inputStyle}
                  />
                </InputIcon>
              </Field>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                marginTop: 4,
                padding: '12px',
                borderRadius: 10,
                border: 'none',
                background: isSubmitting ? '#1e3a2e' : 'linear-gradient(135deg, #22c55e, #16a34a)',
                color: '#fff',
                fontSize: 14,
                fontWeight: 700,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: isSubmitting ? 'none' : '0 4px 16px rgba(34,197,94,0.3)',
                transition: 'all 0.2s',
              }}
            >
              {isSubmitting ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Spinner /> Aguarde...
                </span>
              ) : mode === 'login' ? (
                <><LogIn size={16} /> Entrar</>
              ) : (
                <><UserPlus size={16} /> Criar conta</>
              )}
            </button>
          </form>

          {mode === 'login' && (
            <p style={{ textAlign: 'center', color: '#64748b', fontSize: 12, marginTop: 20 }}>
              Não tem conta?{' '}
              <button onClick={() => switchMode('register')} style={{ background: 'none', border: 'none', color: '#22c55e', cursor: 'pointer', fontWeight: 600, fontSize: 12, padding: 0 }}>
                Criar agora
              </button>
            </p>
          )}
          {mode === 'register' && (
            <p style={{ textAlign: 'center', color: '#64748b', fontSize: 12, marginTop: 20 }}>
              Já tem conta?{' '}
              <button onClick={() => switchMode('login')} style={{ background: 'none', border: 'none', color: '#22c55e', cursor: 'pointer', fontWeight: 600, fontSize: 12, padding: 0 }}>
                Entrar
              </button>
            </p>
          )}
        </div>

        <p style={{ textAlign: 'center', color: '#374151', fontSize: 11, marginTop: 20 }}>
          Dados armazenados localmente no seu navegador
        </p>
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', color: '#94a3b8', fontSize: 12, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </label>
      {children}
      {error && <p style={{ color: '#f87171', fontSize: 12, marginTop: 4 }}>{error}</p>}
    </div>
  );
}

function InputIcon({ icon, rightAction, children }: { icon: React.ReactNode; rightAction?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <span style={{ position: 'absolute', left: 12, color: '#64748b', display: 'flex', pointerEvents: 'none' }}>{icon}</span>
      <div style={{ flex: 1 }}>{children}</div>
      {rightAction && <span style={{ position: 'absolute', right: 12 }}>{rightAction}</span>}
    </div>
  );
}

function Spinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#252840',
  border: '1px solid #2a2d3e',
  borderRadius: 8,
  padding: '10px 36px',
  color: '#e2e8f0',
  fontSize: 14,
  outline: 'none',
  transition: 'border-color 0.2s',
};
