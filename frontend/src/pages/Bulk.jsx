import { useRef, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { api } from '../api/client.js';

const SENTIMENT_CLASS = {
  Pozitif: 'badge-pos',
  Negatif: 'badge-neg',
  Nötr: 'badge-neu',
  Notr: 'badge-neu',
};

function normalizeBulkError(message) {
  if (!message) {
    return 'Yorumlar alınırken bir hata oluştu.';
  }

  const lowered = String(message).toLowerCase();

  if (
    lowered.includes('playwright')
    || lowered.includes('fallback')
    || lowered.includes('executable')
    || lowered.includes('otomatik')
    || lowered.includes('amazon yorumları çekilemedi')
    || lowered.includes('fetch failed')
  ) {
    return 'Ürün yorumları şu anda alınamadı. Lütfen başka bir link dene veya biraz sonra tekrar dene.';
  }

  return String(message);
}

export default function Bulk() {
  const { user } = useOutletContext();
  const [importMode, setImportMode] = useState('product');
  const [file, setFile] = useState(null);
  const [productUrl, setProductUrl] = useState('');
  const [maxReviews, setMaxReviews] = useState(30);
  const [model, setModel] = useState('gemini');
  const [tone, setTone] = useState('Kibar');
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [state, setState] = useState('idle');
  const [results, setResults] = useState([]);
  const [runMeta, setRunMeta] = useState(null);
  const [error, setError] = useState('');
  const [over, setOver] = useState(false);
  const inputRef = useRef(null);
  const requiresAuth = !user;

  function pickFile(selectedFile) {
    if (!selectedFile || !selectedFile.name.endsWith('.csv')) return;
    setFile(selectedFile);
    setError('');
  }

  function beginRun() {
    setState('progress');
    setResults([]);
    setRunMeta(null);
    setProgress(0);
    setProgressLabel('Hazırlanıyor...');
    setError('');
  }

  function createProgressTimer() {
    let fakeProgress = 0;
    return window.setInterval(() => {
      fakeProgress = Math.min(fakeProgress + Math.random() * 7, 88);
      setProgress(Math.round(fakeProgress));
      setProgressLabel('Yorumlar analiz ediliyor...');
    }, 300);
  }

  function finishSuccess(data, timer) {
    window.clearInterval(timer);
    setProgress(100);
    setProgressLabel(`Tamamlandı. ${data.total} yorum analiz edildi ve kaydedildi.`);
    setResults(data.results);
    setRunMeta({
      source: data.source,
      imported: data.imported,
      scraper: data.scraper,
      scraperWarning: data.scraperWarning,
    });
    setState('done');
  }

  function finishError(message, timer) {
    window.clearInterval(timer);
    setError(normalizeBulkError(message));
    setState('idle');
    setProgress(0);
  }

  async function startBulkCsv() {
    if (requiresAuth) {
      setError('Analiz yapmak için önce giriş yapmalısın.');
      return;
    }

    if (!file) return;
    beginRun();
    const timer = createProgressTimer();

    try {
      const form = new FormData();
      form.append('file', file);
      form.append('model', model);
      form.append('tone', tone);

      const data = await api.bulk(form);
      if (data.error) {
        finishError(data.error, timer);
        return;
      }

      finishSuccess(data, timer);
    } catch (requestError) {
      finishError(requestError.message, timer);
    }
  }

  async function startProductImport() {
    if (requiresAuth) {
      setError('Analiz yapmak için önce giriş yapmalısın.');
      return;
    }

    if (!productUrl.trim()) return;
    beginRun();
    const timer = createProgressTimer();

    try {
      const data = await api.bulkProduct({
        productUrl: productUrl.trim(),
        model,
        tone,
        maxReviews,
      });

      if (data.error) {
        finishError(data.error, timer);
        return;
      }

      finishSuccess(data, timer);
    } catch (requestError) {
      finishError(requestError.message, timer);
    }
  }

  function downloadCsv() {
    if (!results.length) return;
    const keys = Object.keys(results[0]);
    const csv = [
      '\uFEFF' + keys.join(','),
      ...results.map((row) =>
        keys.map((key) => `"${String(row[key]).replace(/"/g, '""')}"`).join(','),
      ),
    ].join('\n');

    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    Object.assign(document.createElement('a'), {
      href: url,
      download: 'toplu_analiz.csv',
    }).click();
  }

  const positiveCount = results.filter((row) => row.duygu === 'Pozitif').length;
  const negativeCount = results.filter((row) => row.duygu === 'Negatif').length;
  const neutralCount = results.filter((row) => row.duygu === 'Notr' || row.duygu === 'Nötr').length;

  return (
    <div className="page-shell bulk-page-wide">
      <div className="page-intro page-intro-compact">
        <div>
          <div className="page-eyebrow">Toplu Analiz Akışı</div>
          <h1 className="page-intro-title">Ürün linki veya CSV ile yorum akışını başlat</h1>
          <p className="page-intro-sub">
            Amazon ürün linkinden yorumları otomatik çek; CSV yükleyerek tüm platform
            yorumlarını tek seferde analiz et.
          </p>
        </div>
      </div>

      <section className="flow-visual-panel bulk-visual">
        <div className="flow-visual-copy">
          <span className="flow-visual-kicker">Toplu görünüm</span>
          <h2>Ürün linkinden yorumları topla, otomatik geliştir.</h2>
          <p>
            Amazon ürün linkinden gelen yorumları topla; duygu yoğunluğunu,
            kategori dağılımını ve satıcıya özel cevap önerilerini tek turda üret.
          </p>
        </div>
        <div className="bulk-visual-board">
          <div className="bulk-board-row"><span>Amazon</span><strong>Sınırlı canlı çekim</strong></div>
          <div className="bulk-board-row"><span>Trendyol</span><strong>Beta / challenge</strong></div>
          <div className="bulk-board-row"><span>Hepsiburada</span><strong>Beta / güvenlik duvarı</strong></div>
          <div className="bulk-board-row"><span>n11 / Çiçeksepeti</span><strong>Tanınır / korumalı</strong></div>
          <div className="bulk-board-chart">
            <i style={{ height: '72%' }} />
            <i style={{ height: '48%' }} />
            <i style={{ height: '34%' }} />
          </div>
        </div>
      </section>

      <div className="alert alert-info">
        <i className="fas fa-circle-info" />
        <div>
          Amazon, Trendyol, Hepsiburada, n11 ve Çiçeksepeti linkleri tanınır.
          Sistem önce tarayıcı destekli çekimi dener, koruma varsa fallback veya açıklayıcı hata verir.
          Tüm platformlar için CSV dosyanda <strong>yorum</strong> adında bir sütun kullanabilirsin.
          En fazla 500 satır işlenir.
        </div>
      </div>

      <div className="alert alert-success">
        <i className="fas fa-bolt" />
        <div>
          <strong>Önerilen demo akışı:</strong> Amazon ürün linki ile otomatik yorum çekimi yap,
          ardından sonuçları Gemini, Llama ve OpenRouter ile geliştir.
        </div>
      </div>

      {requiresAuth && (
        <div className="alert alert-info">
          <i className="fas fa-lock" />
          <div>
            Analiz başlatmak için önce giriş yap veya kayıt ol.
            {' '}
            <Link to="/auth?mode=login" className="inline-alert-link">Giriş yap</Link>
            {' '}
            veya
            {' '}
            <Link to="/auth?mode=signup" className="inline-alert-link">kayıt ol</Link>.
          </div>
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          <i className="fas fa-circle-exclamation" />
          <span>{error}</span>
        </div>
      )}

      <div className="card work-card">
        <div className="section-kicker">Import</div>
        <div className="card-title card-title-space"><i className="fas fa-upload" /> Kaynak ve ayarlar</div>

        <div className="auth-mode-switch">
          <button type="button" className={importMode === 'product' ? 'active' : ''} onClick={() => setImportMode('product')}>
            Ürün linki
          </button>
          <button type="button" className={importMode === 'csv' ? 'active' : ''} onClick={() => setImportMode('csv')}>
            CSV yükle
          </button>
        </div>

        {importMode === 'product' ? (
          <div className="section-gap">
            <label className="form-label">Ürün linki</label>
            <input
              className="form-control"
              placeholder="https://www.amazon.com.tr/... önerilen canlı akış"
              value={productUrl}
              disabled={state === 'progress'}
              onChange={(event) => setProductUrl(event.target.value)}
            />
            <p className="compare-help">
              Amazon&apos;da sınırlı otomatik çekim yapılır. Trendyol, Hepsiburada, n11 ve Çiçeksepeti tarafında
              koruma duvarları nedeniyle sonuç platforma göre değişebilir.
            </p>
          </div>
        ) : (
          <>
            <div
              className={`upload-zone${over ? ' over' : ''}`}
              onClick={() => {
                if (state === 'progress') return;
                inputRef.current?.click();
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setOver(true);
              }}
              onDragLeave={() => setOver(false)}
              onDrop={(event) => {
                event.preventDefault();
                setOver(false);
                pickFile(event.dataTransfer.files[0]);
              }}
            >
              <div className="icon"><i className="fas fa-cloud-arrow-up" /></div>
              <h3>CSV dosyasını sürükle veya tıkla</h3>
              <p>UTF-8 önerilir, sadece .csv uzantısı kabul edilir</p>
              {file && <div className="upload-name">{file.name}</div>}
            </div>

            <input
              ref={inputRef}
              type="file"
              accept=".csv"
              disabled={state === 'progress'}
              style={{ display: 'none' }}
              onChange={(event) => pickFile(event.target.files[0])}
            />
          </>
        )}

        <div className="form-row section-gap">
          <div className="form-group">
            <label className="form-label">Hedef yorum sayısı</label>
            <select className="form-control" value={maxReviews} disabled={state === 'progress'} onChange={(event) => setMaxReviews(Number(event.target.value))}>
              <option value={10}>10 yorum</option>
              <option value={20}>20 yorum</option>
              <option value={30}>30 yorum</option>
              <option value={50}>50 yorum</option>
              <option value={100}>100 yorum</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">AI modeli</label>
            <select className="form-control" value={model} disabled={state === 'progress'} onChange={(event) => setModel(event.target.value)}>
              <option value="gemini">Google Gemini 2.5</option>
              <option value="llama">Groq Llama 3.3</option>
              <option value="openrouter">OpenRouter Free</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Cevap tonu</label>
            <select className="form-control" value={tone} disabled={state === 'progress'} onChange={(event) => setTone(event.target.value)}>
              <option>Kibar</option>
              <option>Kurumsal</option>
              <option>Esprili</option>
              <option>Agresif</option>
            </select>
          </div>
        </div>

        <button
          className="btn btn-primary btn-lg btn-full"
          disabled={requiresAuth || (importMode === 'csv' ? !file : !productUrl.trim()) || state === 'progress'}
          onClick={importMode === 'csv' ? startBulkCsv : startProductImport}
        >
          {state === 'progress'
            ? <><i className="fas fa-spinner spin" /> İşleniyor...</>
            : <><i className="fas fa-rocket" /> {importMode === 'csv' ? 'Toplu analizi başlat' : 'Ürün yorumlarını getir ve analiz et'}</>}
        </button>
      </div>

      {(state === 'progress' || state === 'done') && (
        <div className="card">
          <div className="card-title card-title-space">
            <i className={`fas ${state === 'progress' ? 'fa-spinner spin' : 'fa-check-circle'}`} />
            {state === 'progress' ? 'İşleniyor' : 'Tamamlandı'}
          </div>
          <div className="progress-wrap">
            <div className="progress-track"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
            <div className="progress-label">{progressLabel}</div>
          </div>
        </div>
      )}

      {state === 'done' && results.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div className="card-title"><i className="fas fa-table" /> Analiz sonuçları</div>
            <button className="btn btn-ghost" onClick={downloadCsv}><i className="fas fa-download" /> CSV indir</button>
          </div>

          {runMeta?.scraper === 'playwright' && (
            <div className="alert alert-success" style={{ marginBottom: 16 }}>
              <i className="fas fa-wand-magic-sparkles" />
              <span>Yorumlar tarayıcı destekli çekim ile alındı. Kaynak: {runMeta.source} | İçe aktarılan yorum: {runMeta.imported}</span>
            </div>
          )}

          {runMeta?.scraper === 'http-fallback' && (
            <div className="alert alert-info" style={{ marginBottom: 16 }}>
              <i className="fas fa-circle-info" />
              <span>Tarayıcı çekimi başarısız olduğu için {runMeta.imported} görünür yorum yedek yöntemle alındı.</span>
            </div>
          )}

          <div className="bulk-stat-row">
            <span className="bulk-stat bs-pos">Pozitif: {positiveCount}</span>
            <span className="bulk-stat bs-neg">Negatif: {negativeCount}</span>
            <span className="bulk-stat bs-neu">Nötr: {neutralCount}</span>
            <span className="bulk-total">Toplam: {results.length}</span>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Yorum</th>
                  <th>Duygu</th>
                  <th>Kategori</th>
                  <th>Özet</th>
                  <th>Önerilen cevap</th>
                </tr>
              </thead>
              <tbody>
                {results.map((row, index) => (
                  <tr key={`${row.yorum}-${index}`}>
                    <td className="muted-text">{index + 1}</td>
                    <td className="table-col-comment">{row.yorum}</td>
                    <td><span className={`badge ${SENTIMENT_CLASS[row.duygu] || 'badge-neu'}`}>{row.duygu}</span></td>
                    <td><span className="badge badge-cat">{row.kategori}</span></td>
                    <td className="table-col-summary">{row.ozet}</td>
                    <td className="table-col-answer">{row.cevap}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
