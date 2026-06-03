import { useRef, useState } from 'react';
import { api } from '../api/client.js';

const SENTIMENT_CLASS = {
  Pozitif: 'badge-pos',
  Negatif: 'badge-neg',
  Nötr: 'badge-neu',
  Notr: 'badge-neu',
};

export default function Bulk() {
  const [file, setFile] = useState(null);
  const [model, setModel] = useState('gemini');
  const [tone, setTone] = useState('Kibar');
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [state, setState] = useState('idle');
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const [over, setOver] = useState(false);
  const inputRef = useRef(null);

  function pickFile(selectedFile) {
    if (!selectedFile || !selectedFile.name.endsWith('.csv')) return;
    setFile(selectedFile);
    setError('');
  }

  async function startBulk() {
    if (!file) return;
    setState('progress');
    setResults([]);
    setProgress(0);
    setProgressLabel('Hazırlanıyor...');

    let fakeProgress = 0;
    const timer = window.setInterval(() => {
      fakeProgress = Math.min(fakeProgress + Math.random() * 7, 88);
      setProgress(Math.round(fakeProgress));
      setProgressLabel('Yorumlar analiz ediliyor...');
    }, 300);

    try {
      const form = new FormData();
      form.append('file', file);
      form.append('model', model);
      form.append('tone', tone);
      const data = await api.bulk(form);
      window.clearInterval(timer);

      if (data.error) {
        setError(data.error);
        setState('idle');
        setProgress(0);
        return;
      }

      setProgress(100);
      setProgressLabel(`Tamamlandı. ${data.total} yorum analiz edildi ve kaydedildi.`);
      setResults(data.results);
      setState('done');
    } catch (requestError) {
      window.clearInterval(timer);
      setError(requestError.message);
      setState('idle');
      setProgress(0);
    }
  }

  function downloadCsv() {
    if (!results.length) return;
    const keys = Object.keys(results[0]);
    const csv = ['\uFEFF' + keys.join(','), ...results.map((row) => keys.map((key) => `"${String(row[key]).replace(/"/g, '""')}"`).join(','))].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    Object.assign(document.createElement('a'), { href: url, download: 'toplu_analiz.csv' }).click();
  }

  const positiveCount = results.filter((row) => row.duygu === 'Pozitif').length;
  const negativeCount = results.filter((row) => row.duygu === 'Negatif').length;
  const neutralCount = results.filter((row) => row.duygu === 'Notr' || row.duygu === 'Nötr').length;

  return (
    <div className="page-narrow">
      <div className="page-intro page-intro-compact">
        <div>
          <div className="page-eyebrow">Toplu Analiz Akışı</div>
          <h1 className="page-intro-title">CSV yükle, yorumları toplu işle ve kaydet</h1>
          <p className="page-intro-sub">
            `yorum` sütunundaki verileri tek seferde işle, duygu dağılımını gör ve sonuçları indir.
          </p>
        </div>
      </div>

      <section className="flow-visual-panel bulk-visual">
        <div className="flow-visual-copy">
          <span className="flow-visual-kicker">Toplu görünüm</span>
          <h2>Platformlardan gelen akışı tek tabloda toparla.</h2>
          <p>
            Trendyol, Amazon ve Hepsiburada yorumlarını aynı dosyada birleştir; yoğunluğu, duygu
            dağılımını ve cevap üretim sürecini tek turda tamamla.
          </p>
        </div>
        <div className="bulk-visual-board">
          <div className="bulk-board-row"><span>Trendyol</span><strong>214 yorum</strong></div>
          <div className="bulk-board-row"><span>Amazon</span><strong>126 yorum</strong></div>
          <div className="bulk-board-row"><span>Hepsiburada</span><strong>88 yorum</strong></div>
          <div className="bulk-board-chart">
            <i style={{ height: '72%' }} />
            <i style={{ height: '48%' }} />
            <i style={{ height: '34%' }} />
          </div>
        </div>
      </section>

      <div className="alert alert-info">
        <i className="fas fa-circle-info" />
        <div>CSV dosyanda <strong>yorum</strong> adında bir sütun olmalı. En fazla 500 satır işlenir.</div>
      </div>

      {error && <div className="alert alert-error"><i className="fas fa-circle-exclamation" /><span>{error}</span></div>}

      <div className="card work-card">
        <div className="section-kicker">Import</div>
        <div className="card-title card-title-space"><i className="fas fa-upload" /> Dosya ve ayarlar</div>
        <div
          className={`upload-zone${over ? ' over' : ''}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => { event.preventDefault(); setOver(true); }}
          onDragLeave={() => setOver(false)}
          onDrop={(event) => { event.preventDefault(); setOver(false); pickFile(event.dataTransfer.files[0]); }}
        >
          <div className="icon"><i className="fas fa-cloud-arrow-up" /></div>
          <h3>CSV dosyasını sürükle veya tıkla</h3>
          <p>UTF-8 önerilir - sadece .csv uzantısı kabul edilir</p>
          {file && <div className="upload-name">{file.name}</div>}
        </div>

        <input ref={inputRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={(event) => pickFile(event.target.files[0])} />

        <div className="form-row section-gap">
          <div className="form-group">
            <label className="form-label">AI modeli</label>
            <select className="form-control" value={model} onChange={(event) => setModel(event.target.value)}>
              <option value="gemini">Google Gemini 2.5</option>
              <option value="llama">Groq Llama 3.3</option>
              <option value="openrouter">OpenRouter Free</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Cevap tonu</label>
            <select className="form-control" value={tone} onChange={(event) => setTone(event.target.value)}>
              <option>Kibar</option>
              <option>Kurumsal</option>
              <option>Esprili</option>
              <option>Agresif</option>
            </select>
          </div>
        </div>

        <button className="btn btn-primary btn-lg btn-full" disabled={!file || state === 'progress'} onClick={startBulk}>
          {state === 'progress' ? <><i className="fas fa-spinner spin" /> İşleniyor...</> : <><i className="fas fa-rocket" /> Toplu analizi başlat</>}
        </button>
      </div>

      {(state === 'progress' || state === 'done') && (
        <div className="card">
          <div className="card-title card-title-space"><i className={`fas ${state === 'progress' ? 'fa-spinner spin' : 'fa-check-circle'}`} /> {state === 'progress' ? 'İşleniyor' : 'Tamamlandı'}</div>
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

          <div className="bulk-stat-row">
            <span className="bulk-stat bs-pos">Pozitif: {positiveCount}</span>
            <span className="bulk-stat bs-neg">Negatif: {negativeCount}</span>
            <span className="bulk-stat bs-neu">Nötr: {neutralCount}</span>
            <span className="bulk-total">Toplam: {results.length}</span>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>#</th><th>Yorum</th><th>Duygu</th><th>Kategori</th><th>Özet</th><th>Önerilen cevap</th></tr>
              </thead>
              <tbody>
                {results.map((row, index) => (
                  <tr key={`${row.yorum}-${index}`}>
                    <td className="muted-text">{index + 1}</td>
                    <td className="truncate table-col-sm">{row.yorum}</td>
                    <td><span className={`badge ${SENTIMENT_CLASS[row.duygu] || 'badge-neu'}`}>{row.duygu}</span></td>
                    <td><span className="badge badge-cat">{row.kategori}</span></td>
                    <td className="truncate table-col-md">{row.ozet}</td>
                    <td className="truncate table-col-lg">{row.cevap}</td>
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
