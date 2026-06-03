import { Router } from 'express';

const router = Router();

const PLAN_CATALOG = {
  pro: {
    name: 'Pro',
    monthly: 34900,
    yearly: 349000,
  },
  'pro-max': {
    name: 'Pro Max',
    monthly: 79900,
    yearly: 799000,
  },
};

function resolveRedirectUrl(type) {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const fallbackPath = type === 'success'
    ? '/pricing?payment=success'
    : '/pricing?payment=cancel';

  return process.env[`STRIPE_${type.toUpperCase()}_URL`] || `${baseUrl}${fallbackPath}`;
}

router.post('/payments/checkout', async (req, res) => {
  try {
    const { planKey, billing = 'monthly', email, fullName } = req.body || {};

    if (planKey === 'free') {
      return res.json({
        free: true,
        url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth?mode=signup`,
      });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(400).json({
        error: 'Stripe anahtarı tanımlı değil. Ödeme için STRIPE_SECRET_KEY eklenmeli.',
      });
    }

    const plan = PLAN_CATALOG[planKey];
    if (!plan) {
      return res.status(400).json({ error: 'Geçersiz plan seçimi' });
    }

    const interval = billing === 'yearly' ? 'year' : 'month';
    const amount = billing === 'yearly' ? plan.yearly : plan.monthly;
    const successUrl = resolveRedirectUrl('success');
    const cancelUrl = resolveRedirectUrl('cancel');

    const params = new URLSearchParams();
    params.append('mode', 'subscription');
    params.append('success_url', successUrl);
    params.append('cancel_url', cancelUrl);
    params.append('line_items[0][quantity]', '1');
    params.append('line_items[0][price_data][currency]', 'try');
    params.append('line_items[0][price_data][product_data][name]', `Yorum Geliştirme ${plan.name}`);
    params.append(
      'line_items[0][price_data][product_data][description]',
      `${plan.name} planı - ${billing === 'yearly' ? 'Yıllık' : 'Aylık'} abonelik`,
    );
    params.append('line_items[0][price_data][recurring][interval]', interval);
    params.append('line_items[0][price_data][unit_amount]', String(amount));
    params.append('metadata[planKey]', planKey);
    params.append('metadata[billing]', billing);

    if (email) {
      params.append('customer_email', email);
    }

    if (fullName) {
      params.append('metadata[fullName]', fullName);
    }

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    const payload = await response.json();
    if (!response.ok) {
      const message = payload?.error?.message || `Stripe hata kodu: ${response.status}`;
      return res.status(400).json({ error: message });
    }

    res.json({ url: payload.url, id: payload.id });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Ödeme oturumu oluşturulamadı' });
  }
});

export default router;
