import { useMemo, useState } from 'react';
import { Link, useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { setSession } from '../utils/auth.js';

export default function Auth() {
  const navigate = useNavigate();
  const { setUser } = useOutletContext();
  const [params, setParams] = useSearchParams();
  const initialMode = params.get('mode') === 'signup' ? 'signup' : 'login';
  const [mode, setMode] = useState(initialMode);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    passwordRepeat: '',
    teamName: '',
  });

  const copy = useMemo(() => (
    mode === 'signup'
      ? {
          title: 'Yeni hesap oluştur',
          subtitle: 'Platform yorumlarını tek merkezde toplayacak hesabını birkaç adımda aç.',
          cta: 'Kayıt ol',
        }
      : {
          title: 'Hesabına giriş yap',
          subtitle: 'Geçmiş analizlere, ekip akışlarına ve Pro özelliklerine kaldığın yerden devam et.',
          cta: 'Giriş yap',
        }
  ), [mode]);

  function switchMode(nextMode) {
    setMode(nextMode);
    setParams(nextMode === 'signup' ? { mode: 'signup' } : { mode: 'login' });
    setMessage('');
  }

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');

    try {
      if (mode === 'signup') {
        if (form.password !== form.passwordRepeat) {
          throw new Error('Şifre tekrar alanı eşleşmiyor.');
        }

        const data = await api.signup({
          fullName: form.fullName,
          email: form.email,
          password: form.password,
          teamName: form.teamName,
        });

        setSession(data.token, data.user);
        setUser(data.user);
        navigate('/');
        return;
      }

      const data = await api.login({
        email: form.email,
        password: form.password,
      });

      setSession(data.token, data.user);
      setUser(data.user);
      navigate('/');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-shell">
      <div className="auth-panel">
        <div className="auth-panel-copy">
          <span className="flow-visual-kicker">Hesap alanı</span>
          <h1>{copy.title}</h1>
          <p>{copy.subtitle}</p>

          <div className="auth-metric-grid">
            <div className="auth-metric-card">
              <strong>6</strong>
              <span>platform akışı</span>
            </div>
            <div className="auth-metric-card">
              <strong>3</strong>
              <span>LLM modeli</span>
            </div>
            <div className="auth-metric-card">
              <strong>Pro</strong>
              <span>ekip planı</span>
            </div>
          </div>
        </div>

        <div className="auth-form-card">
          <div className="auth-mode-switch">
            <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => switchMode('login')}>
              Giriş yap
            </button>
            <button type="button" className={mode === 'signup' ? 'active' : ''} onClick={() => switchMode('signup')}>
              Kayıt ol
            </button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <label className="form-group">
                <span className="form-label">Ad soyad</span>
                <input
                  className="form-control"
                  placeholder="Örnek: Melih Sancar"
                  value={form.fullName}
                  onChange={(event) => updateField('fullName', event.target.value)}
                />
              </label>
            )}

            <label className="form-group">
              <span className="form-label">E-posta</span>
              <input
                className="form-control"
                type="email"
                placeholder="ornek@firma.com"
                value={form.email}
                onChange={(event) => updateField('email', event.target.value)}
              />
            </label>

            <label className="form-group">
              <span className="form-label">Şifre</span>
              <input
                className="form-control"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(event) => updateField('password', event.target.value)}
              />
            </label>

            {mode === 'signup' && (
              <>
                <label className="form-group">
                  <span className="form-label">Şifre tekrar</span>
                  <input
                    className="form-control"
                    type="password"
                    placeholder="••••••••"
                    value={form.passwordRepeat}
                    onChange={(event) => updateField('passwordRepeat', event.target.value)}
                  />
                </label>

                <label className="form-group">
                  <span className="form-label">Ekip adı</span>
                  <input
                    className="form-control"
                    placeholder="Yorum Operasyon Ekibi"
                    value={form.teamName}
                    onChange={(event) => updateField('teamName', event.target.value)}
                  />
                </label>
              </>
            )}

            <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={submitting}>
              {submitting ? 'Gönderiliyor...' : copy.cta}
            </button>
          </form>

          <div className="auth-helper-row">
            {mode === 'login' ? (
              <>
                <span>Hesabın yok mu?</span>
                <button type="button" className="auth-inline-link" onClick={() => switchMode('signup')}>
                  Hesap oluştur
                </button>
              </>
            ) : (
              <>
                <span>Zaten hesabın var mı?</span>
                <button type="button" className="auth-inline-link" onClick={() => switchMode('login')}>
                  Giriş yap
                </button>
              </>
            )}
          </div>

          <div className="auth-helper-row secondary">
            <Link to="/pricing" className="auth-inline-link">Planları incele</Link>
            <button type="button" className="auth-inline-link" onClick={() => switchMode('login')}>Şifremi unuttum</button>
          </div>

          {message && <div className="alert alert-error"><i className="fas fa-circle-exclamation" /><span>{message}</span></div>}
        </div>
      </div>
    </section>
  );
}
