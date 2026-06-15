import { useMemo, useState } from 'react';
import { Link, useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { setSession } from '../utils/auth.js';

export default function Auth() {
  const navigate = useNavigate();
  const { setUser } = useOutletContext();
  const [params, setParams] = useSearchParams();
  const mode = ['signup', 'reset'].includes(params.get('mode'))
    ? params.get('mode')
    : 'login';
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('error');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordRepeat, setShowPasswordRepeat] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    passwordRepeat: '',
    teamName: '',
  });

  const copy = useMemo(() => {
    if (mode === 'signup') {
      return {
        title: 'Yeni hesap oluştur',
        subtitle: 'Platform yorumlarını tek merkezde toplayacak hesabını birkaç adımda aç.',
        cta: 'Kayıt ol',
      };
    }

    if (mode === 'reset') {
      return {
        title: 'Şifreni yenile',
        subtitle: 'Kayıtlı e-posta adresini ve yeni şifreni girerek hesabına tekrar eriş.',
        cta: 'Şifreyi güncelle',
      };
    }

    return {
      title: 'Hesabına giriş yap',
      subtitle: 'Geçmiş analizlere, ekip akışlarına ve Pro özelliklerine kaldığın yerden devam et.',
      cta: 'Giriş yap',
    };
  }, [mode]);

  function switchMode(nextMode) {
    setParams({ mode: nextMode });
    setMessage('');
    setMessageType('error');
    setShowPassword(false);
    setShowPasswordRepeat(false);
  }

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');
    setMessageType('error');

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

      if (mode === 'reset') {
        if (form.password !== form.passwordRepeat) {
          throw new Error('Yeni şifre ve tekrar alanı eşleşmiyor.');
        }

        const data = await api.resetPassword({
          email: form.email,
          password: form.password,
        });

        setMessage(data.message || 'Şifre başarıyla güncellendi.');
        setMessageType('success');
        setShowPassword(false);
        setShowPasswordRepeat(false);
        setForm((current) => ({ ...current, password: '', passwordRepeat: '' }));
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
      setMessageType('error');
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
              <span className="form-label">
                {mode === 'reset' ? 'Yeni şifre' : 'Şifre'}
              </span>
              <div className="password-field">
                <input
                  className="form-control password-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(event) => updateField('password', event.target.value)}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
                </button>
              </div>
            </label>

            {(mode === 'signup' || mode === 'reset') && (
              <label className="form-group">
                <span className="form-label">
                  {mode === 'reset' ? 'Yeni şifre tekrar' : 'Şifre tekrar'}
                </span>
                <div className="password-field">
                  <input
                    className="form-control password-input"
                    type={showPasswordRepeat ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={form.passwordRepeat}
                    onChange={(event) => updateField('passwordRepeat', event.target.value)}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPasswordRepeat((value) => !value)}
                    aria-label={showPasswordRepeat ? 'Şifreyi gizle' : 'Şifreyi göster'}
                  >
                    <i className={`fas ${showPasswordRepeat ? 'fa-eye-slash' : 'fa-eye'}`} />
                  </button>
                </div>
              </label>
            )}

            {mode === 'signup' && (
              <label className="form-group">
                <span className="form-label">Ekip adı</span>
                <input
                  className="form-control"
                  placeholder="Yorum Operasyon Ekibi"
                  value={form.teamName}
                  onChange={(event) => updateField('teamName', event.target.value)}
                />
              </label>
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
            {mode === 'reset' ? (
              <button type="button" className="auth-inline-link" onClick={() => switchMode('login')}>
                Giriş ekranına dön
              </button>
            ) : (
              <button type="button" className="auth-inline-link" onClick={() => switchMode('reset')}>
                Şifremi unuttum
              </button>
            )}
          </div>

          {message && (
            <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-error'}`}>
              <i className={`fas ${messageType === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}`} />
              <span>{message}</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
