import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api } from '../api/client.js';
import HeroIllustration from '../components/HeroIllustration.jsx';
import trendyolLogo from '../assets/marketplaces/trendyol.svg';
import hepsiburadaLogo from '../assets/marketplaces/hepsiburada.svg';
import amazonLogo from '../assets/marketplaces/amazon.svg';
import n11Logo from '../assets/marketplaces/n11.svg';
import pazaramaLogo from '../assets/marketplaces/pazarama.svg';
import ciceksepetiLogo from '../assets/marketplaces/ciceksepeti.svg';

const PIE_COLORS = ['#6dd3ce', '#f4b35d', '#ff8a65', '#8ea2ff', '#8fd7ff'];

const MARKETPLACES = [
  { name: 'Trendyol', note: 'En yüksek hacim', logo: trendyolLogo, tone: 'orange' },
  { name: 'Hepsiburada', note: 'Destek akışı', logo: hepsiburadaLogo, tone: 'blue' },
  { name: 'Amazon', note: 'Hızlı çözüm hattı', logo: amazonLogo, tone: 'gold' },
  { name: 'n11', note: 'Takip listesi', logo: n11Logo, tone: 'teal' },
  { name: 'Pazarama', note: 'Gelişen kanal', logo: pazaramaLogo, tone: 'violet' },
  { name: 'ÇiçekSepeti', note: 'Özel gün yorumları', logo: ciceksepetiLogo, tone: 'pink' },
];

const PLATFORM_COMMENTS = [
  {
    platform: 'Amazon',
    accent: 'blue',
    customer: 'Selin K.',
    title: 'Kargo hızlı ama kutu ezik geldi',
    quote: 'Ürün iyi ama paketleme daha dikkatli olsa çok daha iyi olurdu.',
    sentiment: 'Karışık',
  },
  {
    platform: 'Trendyol',
    accent: 'orange',
    customer: 'Mert A.',
    title: 'Beklediğimden daha kaliteli',
    quote: 'Renkler fotoğrafa göre daha güzel. Müşteri cevabı önerisi çok işime yaradı.',
    sentiment: 'Pozitif',
  },
  {
    platform: 'Hepsiburada',
    accent: 'green',
    customer: 'Derya T.',
    title: 'İade talebi öncesi erken tespit',
    quote: 'Negatif yorumları önce ayıklayıp ekipte doğru kişiye yönlendirmek çok kritik.',
    sentiment: 'Negatif risk',
  },
];

const CUSTOMER_STORIES = [
  {
    theme: 'soft',
    quote: 'Amazon ve Trendyol yorumlarını tek yerde görmek ekibin cevap hızını gözle görülür biçimde artırdı.',
    name: 'Melih Sancar',
    role: 'Proje yürütücüsü',
  },
  {
    theme: 'lime',
    quote: 'Hangi platformda negatif yorum yükseldiğini anında görmek artık karar almayı çok hızlandırıyor.',
    name: 'Enes Şamlı',
    role: 'Analiz ve operasyon',
  },
];

const PLATFORM_MIX = [
  { platform: 'Trendyol', value: 42, note: 'En fazla yorum akışı' },
  { platform: 'Amazon', value: 28, note: 'Yüksek cevap ihtiyacı' },
  { platform: 'Hepsiburada', value: 18, note: 'Orta hacim' },
  { platform: 'n11', value: 12, note: 'Takip listesinde' },
];

const PREVIEW_PANELS = {
  single: {
    title: 'Tek yorum akışı',
    subtitle: 'Bir yorumu anında analiz edip doğru kategori ve cevap önerisini gösterir.',
    bullets: ['Duygu tespiti', 'Kategori etiketi', 'Hazır müşteri cevabı'],
    cta: '/analyze',
  },
  bulk: {
    title: 'Toplu CSV akışı',
    subtitle: 'Platformlardan gelen yorum dosyasını tek seferde analiz eder.',
    bullets: ['500+ satır', 'Kayıtlı veritabanı akışı', 'CSV / Excel dışa aktarma'],
    cta: '/bulk',
  },
};

const CHANGELOG_ITEMS = [
  { title: 'Tek Yorum Motoru', text: 'Tek yorum için duygu, kategori ve kurumsal cevap önerisi üretir.', date: 'Canlı mod' },
  { title: 'Toplu CSV Akışı', text: 'Yüzlerce yorumu tek seferde analiz edip veritabanına kaydeder.', date: '500+ satır' },
  { title: 'Model Karşılaştırma', text: '3 farklı LLM çıktısını aynı ekranda kıyaslamaya imkan verir.', date: 'Paralel analiz' },
  { title: 'Analiz Geçmişi', text: 'Tüm sonuçları filtreleyip dışa aktarma ve raporlama akışına bağlar.', date: 'CSV + Excel' },
];

function AnimatedNumber({ value }) {
  const [display, setDisplay] = useState(0);
  const previousValue = useRef(0);

  useEffect(() => {
    const target = value || 0;
    const start = previousValue.current;
    previousValue.current = target;
    if (target === start) return undefined;

    const steps = 36;
    let step = 0;
    const timer = window.setInterval(() => {
      step += 1;
      const progress = step / steps;
      const eased = 1 - ((1 - progress) ** 3);
      setDisplay(Math.round(start + ((target - start) * eased)));
      if (step >= steps) {
        setDisplay(target);
        window.clearInterval(timer);
      }
    }, 22);

    return () => window.clearInterval(timer);
  }, [value]);

  return display;
}

function sentimentBadge(sentiment) {
  const classMap = {
    Pozitif: 'badge-pos',
    Negatif: 'badge-neg',
    Notr: 'badge-neu',
    Karışık: 'badge-neu',
    'Negatif risk': 'badge-neg',
  };

  return <span className={`badge ${classMap[sentiment] || 'badge-neu'}`}>{sentiment}</span>;
}

function MarketplaceLogo({ item }) {
  return (
    <article className={`market-logo-card ${item.tone}`}>
      <div className="market-logo-image-wrap">
        <img src={item.logo} alt={`${item.name} logosu`} className="market-logo-image" />
      </div>
      <strong>{item.name}</strong>
      <span>{item.note}</span>
    </article>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [previewKey, setPreviewKey] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    setSpinning(true);
    try {
      const stats = await api.getStats();
      setData(stats);
    } catch {
      setData(null);
    } finally {
      setSpinning(false);
      setLoading(false);
    }
  }

  async function resetDb() {
    if (!window.confirm('Tum analiz kayitlari silinecek. Emin misin?')) return;
    await api.reset();
    await loadStats();
  }

  const categoryChartData = Object.entries(data?.category_dist || {}).map(([name, value]) => ({ name, value }));
  const preview = previewKey ? PREVIEW_PANELS[previewKey] : null;

  const heroStats = useMemo(
    () => [
      { value: `${data?.total ?? 0}`, label: 'Toplam analiz' },
      { value: `${data?.positive ?? 0}`, label: 'Pozitif sinyal' },
      { value: '6', label: 'Platform akisi' },
    ],
    [data],
  );

  const quickFlows = [
    { to: '/analyze', title: 'Tek Yorum Analizi', desc: 'Bir yorumu aninda isle ve cevap onerisi uret.' },
    { to: '/bulk', title: 'Toplu CSV Akisi', desc: 'Yorum setlerini tek seferde yukle, analiz et ve kaydet.' },
    { to: '/compare', title: 'Model Karsilastirma', desc: 'Gemini, Llama ve OpenRouter sonucunu yan yana gor.' },
  ];

  return (
    <>
      <section className="linear-home-hero">
        <div className="linear-hero-bg">
          <HeroIllustration />
        </div>
        <div className="linear-hero-copy">
            <div className="linear-eyebrow">LLM destekli yorum geliştirme platformu</div>
          <h1 className="linear-hero-title">
            Müşteri yorumlarını
            <br />
            içgörüye ve aksiyona
            <br />
            dönüştüren ürün.
          </h1>
          <p className="linear-hero-sub">
            Trendyol, Hepsiburada, Amazon ve diğer platformlardan gelen yorumları tek merkezde
            topla; duygu, kategori, cevap önerisi ve ekip aksiyonunu aynı panelde yönet.
          </p>
          <div className="landing-actions">
            <button type="button" className="btn btn-hero-primary btn-lg" onClick={() => setPreviewKey('single')}>
              Tek yorum akışına bak
            </button>
            <button type="button" className="btn btn-outline-white btn-lg" onClick={() => setPreviewKey('bulk')}>
              Toplu akışına bak
            </button>
            <Link to="/pricing" className="btn btn-ghost btn-lg">Pro planları incele</Link>
          </div>
        </div>

        <div className="linear-hero-side">
          <span className="linear-hero-dot" />
          Platform bazlı yorum operasyonu
          <Link to="/compare" className="linear-hero-inline-link">modelleri karşılaştır</Link>
        </div>
      </section>

      {preview && (
        <section className="preview-overlay-card">
          <div className="preview-overlay-head">
            <div>
              <h3>{preview.title}</h3>
              <p>{preview.subtitle}</p>
            </div>
            <button type="button" className="preview-close" onClick={() => setPreviewKey('')}>
              <i className="fas fa-xmark" />
            </button>
          </div>
          <div className="preview-bullets">
            {preview.bullets.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
            <Link to={preview.cta} className="preview-open-link">Tam ekran aç</Link>
        </section>
      )}

      <section className="market-logo-grid">
        {MARKETPLACES.map((item) => (
          <MarketplaceLogo key={item.name} item={item} />
        ))}
      </section>

      <section className="linear-home-hero secondary">
        <div className="linear-hero-copy wide">
          <h2 className="linear-species-title">
            Yorum analizinde yeni bir tur.
            <span> Hangi müşterinin hangi platformda yoğunlaştığını tek bakışta gören çalışma alanı.</span>
          </h2>
        </div>
      </section>

      <section className="platform-insight-section">
        <div className="linear-story-section narrow">
          <div className="linear-story-copy">
            <h2>Hangi platform daha yoğun, hangi yorum daha riskli hemen gör.</h2>
          </div>
          <div className="linear-story-detail">
            <p>
              Platform yoğunluğu ve müşteri yorum örnekleri aynı sayfada dursun; ekip ana ekrandan
              ayrılmadan aksiyon alsın.
            </p>
            <span className="linear-story-link muted">Platform karışımı</span>
          </div>
        </div>

        <div className="platform-insight-grid">
          <div className="platform-volume-card">
            <div className="platform-volume-head">
              <h3>Platform bazlı yoğunluk</h3>
              <span>Son 30 gün</span>
            </div>
            <div className="platform-volume-list">
              {PLATFORM_MIX.map((item) => (
                <div key={item.platform} className="platform-volume-row">
                  <div className="platform-volume-copy">
                    <strong>{item.platform}</strong>
                    <span>{item.note}</span>
                  </div>
                  <div className="platform-volume-bar">
                    <div className="platform-volume-fill" style={{ width: `${item.value}%` }} />
                  </div>
                  <em>{item.value}%</em>
                </div>
              ))}
            </div>
          </div>

          <div className="platform-comments-grid">
            {PLATFORM_COMMENTS.map((item) => (
              <article key={`${item.platform}-${item.customer}`} className={`platform-comment-card ${item.accent}`}>
                <div className="platform-comment-top">
                  <span>{item.platform}</span>
                  {sentimentBadge(item.sentiment)}
                </div>
                <h3>{item.title}</h3>
                <p>{item.quote}</p>
                <div className="platform-comment-footer">
                  <strong>{item.customer}</strong>
                  <small>{item.platform} yorumu</small>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="customer-story-showcase">
        {CUSTOMER_STORIES.map((story) => (
          <article key={story.name} className={`customer-story-card ${story.theme}`}>
            <p>"{story.quote}"</p>
            <div className="customer-story-footer">
              <div className="customer-story-avatar" />
              <div>
                <strong>{story.name}</strong>
                <span>{story.role}</span>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="linear-story-section">
        <div className="linear-story-copy">
          <h2>Yorumu al, doğru takıma yönlendir, aksiyona çevir.</h2>
        </div>
        <div className="linear-story-detail">
          <p>
            Müşteri yorumlarını sadece okumakla kalma. Onları etiketlenmiş, önceliklendirilmiş ve
            cevaplanmaya hazır operasyon birimlerine dönüştür.
          </p>
          <Link to="/auth" className="linear-story-link">Hesap akışı</Link>
        </div>
      </section>

      <section className="linear-stage story-stage">
        <div className="linear-stage-shell">
          <div className="linear-stage-head">
            <div className="linear-stage-left">
              <span className="linear-mini-brand">Canli yorum panosu</span>
            </div>
            <div className="linear-stage-right">
              <span>Bekleyen</span>
              <span>Isleniyor</span>
              <span>Tamamlandi</span>
            </div>
          </div>

          <div className="linear-stage-body">
            <aside className="linear-stage-panel">
              <div className="linear-stage-panel-title">Akislar</div>
              {quickFlows.map((item) => (
                <button key={item.title} type="button" className="linear-stage-item" onClick={() => navigate(item.to)}>
                  <strong>{item.title}</strong>
                  <span>{item.desc}</span>
                </button>
              ))}
              <button type="button" className="linear-stage-item" onClick={() => navigate('/pricing')}>
                <strong>Ucretlendirme</strong>
                <span>Pro ve Pro Max planlarini karsilastir.</span>
              </button>
            </aside>

            <div className="linear-stage-preview">
              <div className="linear-stage-visual">
                <HeroIllustration />
              </div>
              <div className="linear-floating-card top">
              <span>Toplam analiz</span>
                <strong><AnimatedNumber value={data?.total ?? 0} /></strong>
                <small>Kalıcı PostgreSQL kaydı</small>
              </div>
              <div className="linear-floating-card bottom">
              <span>Pozitif yorum</span>
                <strong><AnimatedNumber value={data?.positive ?? 0} /></strong>
                <small>Operasyondaki en güçlü sinyal</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="card card-loading">
          <div className="loading-dots"><span /><span /><span /></div>
        </div>
      ) : (
        <>
          <div className="stats-row linear-stats-row">
              {heroStats.map((item) => (
              <div key={item.label} className="stat-card metric-soft-card">
                <div className="stat-info">
                  <div className="stat-val"><AnimatedNumber value={Number(item.value) || 0} /></div>
                <div className="stat-label">{item.label}</div>
                </div>
              </div>
            ))}
            <div className="stat-card metric-soft-card accent">
              <div className="stat-info">
                <div className="stat-val">Pro</div>
                <div className="stat-label">Kurumsal ekip paketi</div>
              </div>
            </div>
          </div>

          <div className="chart-row-2">
            <div className="card chart-card soft-card-surface">
              <div className="card-header">
                <div className="card-title"><i className="fas fa-chart-area" /> Günlük duygu trendi</div>
              </div>
              {!data?.time_series?.length ? (
                <div className="empty compact-empty"><i className="fas fa-chart-line" /><p>Grafik için henüz veri yok</p></div>
              ) : (
                <div className="chart-shell">
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={data.time_series}>
                      <defs>
                        <linearGradient id="trendPositive" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6dd3ce" stopOpacity={0.55} />
                          <stop offset="95%" stopColor="#6dd3ce" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="trendNegative" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ff8a65" stopOpacity={0.45} />
                          <stop offset="95%" stopColor="#ff8a65" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                      <XAxis dataKey="date" stroke="#8b96a8" tickLine={false} axisLine={false} />
                      <YAxis stroke="#8b96a8" tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ background: '#171a1e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }} />
                      <Area type="monotone" dataKey="Pozitif" stroke="#6dd3ce" fill="url(#trendPositive)" strokeWidth={3} />
                      <Area type="monotone" dataKey="Negatif" stroke="#ff8a65" fill="url(#trendNegative)" strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="card chart-card soft-card-surface">
              <div className="card-header">
                <div className="card-title"><i className="fas fa-chart-pie" /> Kategori dağılımı</div>
              </div>
              {!categoryChartData.length ? (
                <div className="empty compact-empty"><i className="fas fa-circle-notch" /><p>Kategori verisi bulunamadı</p></div>
              ) : (
                <div className="chart-shell">
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={categoryChartData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={92} paddingAngle={4}>
                        {categoryChartData.map((entry, index) => (
                          <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#171a1e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="chart-legend">
                    {categoryChartData.map((entry, index) => (
                      <div key={entry.name} className="chart-legend-item">
                        <span className="chart-legend-dot" style={{ background: PIE_COLORS[index % PIE_COLORS.length] }} />
                        {entry.name}
                        <strong>{entry.value}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="feature-cards-row linear-feature-row">
            {CHANGELOG_ITEMS.map((item, index) => (
              <article key={item.title} className="feature-card linear-feature-card soft-card-surface" style={{ '--fc-color': PIE_COLORS[index] }}>
                <div className="fc-title">{item.title}</div>
                <div className="fc-desc">{item.text}</div>
                <span className="fc-badge">{item.date}</span>
              </article>
            ))}
          </div>

          <div className="card soft-card-surface">
            <div className="card-header">
              <div className="card-title"><i className="fas fa-clock-rotate-left" /> Son analizler</div>
              <div className="header-actions">
                <button className="btn btn-ghost" onClick={loadStats} disabled={spinning}>
                  <i className={`fas fa-rotate-right${spinning ? ' spin' : ''}`} />
                  Yenile
                </button>
                <Link to="/history" className="btn btn-ghost"><i className="fas fa-list" /> Tümünü gör</Link>
                <a href={api.exportCsv()} className="btn btn-ghost"><i className="fas fa-file-csv" /> CSV</a>
                <a href={api.exportExcel()} className="btn btn-ghost"><i className="fas fa-file-excel" /> Excel</a>
                <button className="btn btn-danger" onClick={resetDb}><i className="fas fa-trash" /> Sıfırla</button>
              </div>
            </div>

            {!data?.recent?.length ? (
              <div className="empty">
                <i className="fas fa-inbox" />
                <h3>Henüz veri yok</h3>
                <p>İlk analizi Yorum Analizi sayfasından başlatabilirsin.</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Tarih</th><th>Model</th><th>Duygu</th><th>Kategori</th><th>Özet</th></tr>
                  </thead>
                  <tbody>
                    {data.recent.map((row, index) => (
                      <tr key={`${row.date}-${index}`}>
                        <td className="td-nowrap">{row.date}</td>
                        <td>{row.model || '-'}</td>
                        <td>{sentimentBadge(row.sentiment)}</td>
                        <td><span className="badge badge-cat">{row.category || '-'}</span></td>
                        <td className="truncate">{row.summary}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
