import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';

const PLANS = [
  {
    key: 'free',
    name: 'Free',
    monthly: '₺0',
    yearly: '₺0',
    badge: 'Deneme başlangıcı',
    features: ['1 platform entegrasyonu', 'Aylık 300 yorum analizi', 'Tek yorum analizi', 'Temel özet görünümü'],
  },
  {
    key: 'pro',
    name: 'Pro',
    monthly: '₺349',
    yearly: '₺3.490',
    badge: 'Ekip başlangıcı',
    features: ['3 platform entegrasyonu', 'Aylık 5.000 yorum analizi', 'Tek yorum + toplu CSV akışı', 'Temel raporlama'],
  },
  {
    key: 'pro-max',
    name: 'Pro Max',
    monthly: '₺799',
    yearly: '₺7.990',
    badge: 'En popüler',
    featured: true,
    features: ['Tüm platformlar', 'Aylık 25.000 yorum analizi', 'Model karşılaştırma + gelişmiş raporlama', 'Ekip yönetimi ve öncelikli destek'],
  },
];

export default function Pricing() {
  const [billing, setBilling] = useState('monthly');
  const [selectedPlan, setSelectedPlan] = useState('pro');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    fullName: '',
    email: '',
  });

  const activePlan = useMemo(
    () => PLANS.find((plan) => plan.key === selectedPlan) || PLANS[0],
    [selectedPlan],
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentState = params.get('payment');

    if (paymentState === 'success') {
      setMessage('Ödeme başarılı görünüyor. Abonelik aktivasyonu için ödeme sağlayıcısı dönüşü alındı.');
    } else if (paymentState === 'cancel') {
      setMessage('Ödeme işlemi iptal edildi. Dilersen tekrar deneyebilirsin.');
    }
  }, []);

  function updateField(key, value) {
    setPaymentForm((current) => ({ ...current, [key]: value }));
  }

  async function handleCheckout(event) {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await api.createCheckout({
        planKey: activePlan.key,
        billing,
        fullName: paymentForm.fullName.trim(),
        email: paymentForm.email.trim(),
      });

      if (response.free && response.url) {
        window.location.href = response.url;
        return;
      }

      if (response.url) {
        window.location.href = response.url;
        return;
      }

      setMessage('Ödeme oturumu oluşturuldu ancak yönlendirme adresi dönmedi.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="pricing-shell">
      <div className="page-intro">
        <div>
          <div className="page-eyebrow">Ücretlendirme</div>
          <h1 className="page-intro-title">Free, Pro ve Pro Max planlarıyla ölçeklen</h1>
          <p className="page-intro-sub">
            Yorum yoğunluğu arttıkça ekip akışını ve model kapasitesini yükselt.
            Aylık ve yıllık seçenekler hazır.
          </p>
        </div>

        <div className="billing-toggle">
          <button type="button" className={billing === 'monthly' ? 'active' : ''} onClick={() => setBilling('monthly')}>
            Aylık
          </button>
          <button type="button" className={billing === 'yearly' ? 'active' : ''} onClick={() => setBilling('yearly')}>
            Yıllık
          </button>
        </div>
      </div>

      <div className="pricing-grid pricing-grid-wide">
        {PLANS.map((plan) => (
          <article
            key={plan.key}
            className={`pricing-card${plan.featured ? ' featured' : ''}${selectedPlan === plan.key ? ' selected' : ''}`}
          >
            <div className="pricing-badge">{plan.badge}</div>
            <h2>{plan.name}</h2>
            <div className="pricing-amount">
              <strong>{billing === 'monthly' ? plan.monthly : plan.yearly}</strong>
              <span>{billing === 'monthly' ? '/ ay' : '/ yıl'}</span>
            </div>
            <ul className="pricing-features">
              {plan.features.map((feature) => (
                <li key={feature}><i className="fas fa-check" /> {feature}</li>
              ))}
            </ul>
            <button
              type="button"
              className={`btn btn-lg btn-full ${selectedPlan === plan.key || plan.featured ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setSelectedPlan(plan.key)}
            >
              {plan.key === 'free' ? 'Free planı seç' : 'Planı seç'}
            </button>
          </article>
        ))}
      </div>

      <section className="payment-shell">
        <div className="payment-copy">
          <span className="flow-visual-kicker">Ödeme alanı</span>
          <h2>{activePlan.name} planı seçildi</h2>
          <p>
            {activePlan.key === 'free'
              ? 'Free plan için ödeme gerekmez. Hemen hesap oluşturup temel akışla başlayabilirsin.'
              : 'Ücretli plan seçildiğinde Stripe Checkout oturumu oluşturulur ve güvenli ödeme sayfasına yönlendirilirsin.'}
          </p>
        </div>

        {activePlan.key === 'free' ? (
          <div className="payment-card free-payment-card">
            <strong>Ödeme gerekmiyor</strong>
            <span>Free plan ile temel yorum analizi akışını hemen kullanabilirsin.</span>
            <button type="button" className="btn btn-primary" onClick={() => { window.location.href = '/auth?mode=signup'; }}>
              Free ile başla
            </button>
          </div>
        ) : (
          <div className="payment-card">
            <form className="auth-form" onSubmit={handleCheckout}>
              <label className="form-group">
                <span className="form-label">Ad soyad</span>
                <input
                  className="form-control"
                  placeholder="Melih Sancar"
                  value={paymentForm.fullName}
                  onChange={(event) => updateField('fullName', event.target.value)}
                />
              </label>

              <label className="form-group">
                <span className="form-label">Fatura e-postası</span>
                <input
                  className="form-control"
                  type="email"
                  placeholder="ornek@firma.com"
                  value={paymentForm.email}
                  onChange={(event) => updateField('email', event.target.value)}
                />
              </label>

              <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading}>
                {loading ? 'Ödeme sayfası hazırlanıyor...' : `${activePlan.name} için ödemeye geç`}
              </button>
            </form>

            {message && <div className="alert alert-success"><i className="fas fa-check-circle" /><span>{message}</span></div>}
          </div>
        )}
      </section>
    </section>
  );
}
