import { useRef, useState } from 'react';
import { api } from '../api/client.js';

const MODEL_LABELS = {
  gemini: 'Gemini 2.5 Flash',
  llama: 'Groq Llama 3.3 (70B)',
  openrouter: 'OpenRouter Free',
};

const SENTIMENT_CLASS = {
  Pozitif: 'badge-pos',
  Negatif: 'badge-neg',
  Nötr: 'badge-neu',
  Notr: 'badge-neu',
};

const MODEL_OPTIONS = [
  { key: 'gemini', logo: 'G', logoClass: 'engine-logo-g', name: 'Gemini 2.5 Flash', sub: 'Önerilen - hızlı ve dengeli' },
  { key: 'llama', logo: 'L', logoClass: 'engine-logo-l', name: 'Groq Llama 3.3', sub: '70B - hızlı cevap üretimi' },
  { key: 'openrouter', logo: 'OR', logoClass: 'engine-logo-d', name: 'OpenRouter Free', sub: 'Ucretsiz model yonlendirme' },
];

const TIP_CARDS = [
  { icon: 'fa-face-smile', color: '#4f8cff', bg: 'rgba(79,140,255,0.14)', title: 'Duygu tespiti', desc: 'Yorum pozitif, negatif veya nötr olarak otomatik sınıflandırılır.' },
  { icon: 'fa-tags', color: '#10B981', bg: 'rgba(16,185,129,0.14)', title: 'Kategori belirleme', desc: 'Kargo, ürün kalitesi ve fiyat gibi konu etiketleri üretilir.' },
  { icon: 'fa-reply', color: '#23c7d9', bg: 'rgba(35,199,217,0.14)', title: 'Hazır cevap', desc: 'Seçilen tonda müşteriye dönülecek cevap anında hazırlanır.' },
  { icon: 'fa-database', color: '#F59E0B', bg: 'rgba(245,158,11,0.14)', title: 'Otomatik kayıt', desc: 'Başarılı analizler veritabanına yazılır.' },
];

export default function Analyze() {
  const [comment, setComment] = useState('');
  const [model, setModel] = useState('gemini');
  const [tone, setTone] = useState('Kibar');
  const [state, setState] = useState('idle');
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef(null);

  async function doAnalyze() {
    if (!comment.trim()) {
      setState('error');
      setErrorMessage('Lütfen bir yorum gir.');
      return;
    }

    setState('loading');
    setResult(null);
    setErrorMessage('');

    try {
      const response = await api.analyze({ comment: comment.trim(), model, tone });
      if (response.error) {
        setState('error');
        setErrorMessage(response.error);
        return;
      }

      setResult(response);
      setState('result');
    } catch (error) {
      setState('error');
      setErrorMessage(error.message);
    }
  }

  async function copyReply() {
    if (!result?.reply) return;
    await navigator.clipboard.writeText(result.reply);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <div className="page-intro">
        <div>
          <div className="page-eyebrow">Tek Yorum Akışı</div>
          <h1 className="page-intro-title">Tek yorumdan anlık duygu, kategori ve cevap üret</h1>
          <p className="page-intro-sub">
            Bir yorumu seçilen modelle işle, sonucu gör ve müşteriye gidecek metni tek ekranda yönet.
          </p>
        </div>
        <div className="page-intro-meta">
          <div className="page-intro-chip"><i className="fas fa-brain" /> 3 model seçeneği</div>
          <div className="page-intro-chip"><i className="fas fa-database" /> Kalıcı kayıt akışı</div>
        </div>
      </div>

      <section className="flow-visual-panel analyze-visual">
        <div className="flow-visual-copy">
          <span className="flow-visual-kicker">Anlık görünüm</span>
          <h2>Yorumu al, sinyali yakala, doğru cevabı öner.</h2>
          <p>
            Duygu, kategori ve cevap önerisi aynı akış içinde görünür.
            Böylece ekip müşteri yorumunu okumakla vakit kaybetmeden doğrudan aksiyona geçer.
          </p>
        </div>
        <div className="flow-visual-stage">
          <div className="flow-visual-bubble first">
            <strong>Amazon</strong>
            <span>Kargo hızlı ama kutu ezik geldi.</span>
          </div>
          <div className="flow-visual-bubble second">
            <strong>Nötr</strong>
            <span>Paketleme etiketi, kargo kategorisi</span>
          </div>
          <div className="flow-visual-bubble third">
            <strong>Hazır cevap</strong>
            <span>Üzgünüz, yeni ürün gönderimini hemen başlatalım.</span>
          </div>
        </div>
      </section>

      <div className="analyze-layout">
        <div className="analyze-form-col">
          <div className="card work-card">
            <div className="section-kicker">Girdi</div>
            <div className="card-title card-title-space"><i className="fas fa-comment-dots" /> Müşteri yorumu</div>
            <textarea
              ref={textareaRef}
              className="form-control analyze-textarea"
              placeholder={'Müşteri yorumunu buraya yaz.\n\nÖrnek: Ürün çok kaliteli geldi, kargo da hızlıydı. Teşekkürler!'}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
            />
            <div className="char-row">
              <span className="char-count">{comment.length} karakter</span>
              <button
                type="button"
                className="btn btn-ghost char-clear-btn"
                onClick={() => {
                  setComment('');
                  textareaRef.current?.focus();
                }}
              >
                <i className="fas fa-xmark" /> Temizle
              </button>
            </div>
          </div>

          <div className="card work-card">
            <div className="section-kicker">Ayarlar</div>
            <div className="card-title card-title-space"><i className="fas fa-sliders" /> Analiz ayarları</div>
            <div className="form-group">
              <label className="form-label">İşlem motoru</label>
              <div className="engine-options">
                {MODEL_OPTIONS.map((option) => (
                  <label key={option.key} className="engine-opt" onClick={() => setModel(option.key)}>
                    <input type="radio" name="model" value={option.key} checked={model === option.key} readOnly />
                    <div className={`engine-card${model === option.key ? ' selected' : ''}`}>
                      <div className={`engine-logo ${option.logoClass}`}>{option.logo}</div>
                      <div>
                        <div className="engine-name">{option.name}</div>
                        <div className="engine-sub">{option.sub}</div>
                      </div>
                      <div className="engine-check"><i className="fas fa-check-circle" /></div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group form-group-last">
              <label className="form-label">Müşteri cevap tonu</label>
              <div className="tone-options">
                {['Kibar', 'Kurumsal', 'Esprili', 'Agresif'].map((item) => (
                  <label key={item} className="tone-opt" onClick={() => setTone(item)}>
                    <input type="radio" name="tone" value={item} checked={tone === item} readOnly />
                    <span>{item}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <button className="btn btn-primary btn-lg btn-full" onClick={doAnalyze} disabled={state === 'loading'}>
            {state === 'loading'
              ? <><i className="fas fa-spinner spin" /> Analiz ediliyor...</>
              : <><i className="fas fa-magnifying-glass-chart" /> Yorumu analiz et</>}
          </button>
        </div>

        <div className="analyze-result-col">
          {state === 'idle' && (
            <>
              <div className="idle-banner idle-banner-linear">
                <div className="idle-icon-wrap"><i className="fas fa-wave-square" /></div>
                <div className="idle-title">Canlı sonuç paneli hazır</div>
                <div className="idle-sub">
                  Yorumu gir, modeli seç ve
                  <br />
                  <strong>Yorumu analiz et</strong> butonuna bas.
                </div>
              </div>
              <div className="tips-grid">
                {TIP_CARDS.map((tip) => (
                  <div key={tip.title} className="tip-card">
                    <div className="tip-icon" style={{ color: tip.color, background: tip.bg }}><i className={`fas ${tip.icon}`} /></div>
                    <div className="tip-text"><strong>{tip.title}</strong>{tip.desc}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {state === 'loading' && (
            <div className="loading-banner">
              <div className="loading-dots"><span /><span /><span /></div>
              <div className="loading-title">Analiz ediliyor...</div>
              <div className="loading-sub">{MODEL_LABELS[model]} yorumu işliyor</div>
            </div>
          )}

          {state === 'error' && (
            <div className="alert alert-error"><i className="fas fa-circle-exclamation" /><span>{errorMessage}</span></div>
          )}

          {state === 'result' && result && (
            <>
              <div className="result-header-bar">
                <div className="badge-row">
                  <span className={`badge ${SENTIMENT_CLASS[result.sentiment] || 'badge-neu'} big-badge`}>{result.sentiment}</span>
                  <span className="badge badge-cat">{result.category}</span>
                </div>
                <span className="result-model-chip">
                  <i className="fas fa-gear" /> {result.fallbackModel || MODEL_LABELS[model]}
                </span>
              </div>
              <div className="result-body">
                {result.fallbackModel && (
                  <div className="alert alert-success">
                    <i className="fas fa-shuffle" />
                    <span>Birincil model yoğun olduğu için analiz {result.fallbackModel} ile tamamlandı.</span>
                  </div>
                )}
                <div className="result-section">
                  <div className="result-section-label"><i className="fas fa-align-left" /> Yorum özeti</div>
                  <div className="result-section-text">{result.summary}</div>
                </div>
                <div className="result-reply-block">
                  <div className="result-reply-top">
                    <div className="result-section-label result-section-inline"><i className="fas fa-reply" /> Önerilen müşteri cevabı</div>
                    <button className="copy-btn" onClick={copyReply} style={copied ? { color: 'var(--pos)', borderColor: 'rgba(16,185,129,0.4)' } : {}}>
                      <i className={`fas fa-${copied ? 'check' : 'copy'}`} /> {copied ? 'Kopyalandı' : 'Kopyala'}
                    </button>
                  </div>
                  <div className="result-section-text result-reply-surface">{result.reply}</div>
                </div>
                <div className="save-note"><i className="fas fa-check-circle" /> Analiz kaydı başarıyla saklandı</div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
