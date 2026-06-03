import { useState } from 'react';
import { api } from '../api/client.js';

const SENTIMENT_CLASS = {
  Pozitif: 'badge-pos',
  Negatif: 'badge-neg',
  Nötr: 'badge-neu',
  Notr: 'badge-neu',
};

const MODEL_DISPLAY = {
  gemini: 'Google Gemini 2.5',
  llama: 'Groq Llama 3.3 (70B)',
  deepseek: 'DeepSeek-R1',
};

function ModelCard({ data }) {
  if (!data) {
    return <div className="alert alert-info"><i className="fas fa-circle-info" /><span>Sonuç bekleniyor</span></div>;
  }

  if (data.error) {
    return <div className="alert alert-error"><i className="fas fa-circle-exclamation" /><span>{data.error}</span></div>;
  }

  return (
    <>
      <div className="compare-badges">
        <span className={`badge ${SENTIMENT_CLASS[data.sentiment] || 'badge-neu'}`}>{data.sentiment}</span>
        <span className="badge badge-cat">{data.category}</span>
      </div>
      <div className="result-box">
        <div className="result-box-label">Özet</div>
        <div className="result-box-value">{data.summary}</div>
      </div>
      <div className="result-reply">
        <div className="result-reply-label"><i className="fas fa-reply" /> Cevap</div>
        <div className="result-reply-text">{data.reply}</div>
      </div>
    </>
  );
}

export default function Compare() {
  const [comment, setComment] = useState('');
  const [tone, setTone] = useState('Kibar');
  const [state, setState] = useState('idle');
  const [results, setResults] = useState({});
  const [saveMessage, setSaveMessage] = useState('');

  async function doCompare() {
    if (!comment.trim()) {
      window.alert('Lütfen bir yorum gir.');
      return;
    }

    setState('loading');
    setResults({});
    try {
      const response = await api.compare({ comment: comment.trim(), tone });
      setResults(response);
      setState('result');
    } catch (error) {
      setState('idle');
      window.alert(`Hata: ${error.message}`);
    }
  }

  async function saveModel(key) {
    const data = results[key];
    if (!data || data.error) {
      window.alert('Bu modelin sonucu kaydedilemez.');
      return;
    }

    await api.save({ model: MODEL_DISPLAY[key], comment, ...data });
    setSaveMessage('Kaydedildi');
    window.setTimeout(() => setSaveMessage(''), 2500);
  }

  const sentiments = Object.values(results).map((item) => item?.sentiment).filter(Boolean);
  const uniqueSentiments = [...new Set(sentiments)];
  const counts = {};
  sentiments.forEach((sentiment) => {
    counts[sentiment] = (counts[sentiment] || 0) + 1;
  });
  const majority = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];

  let verdict = null;
  if (state === 'result' && sentiments.length) {
    if (uniqueSentiments.length === 1) {
      verdict = {
        icon: 'fa-badge-check',
        text: `3 model hemfikir: ${uniqueSentiments[0]}`,
        sub: 'Tüm modeller aynı duygu sonucuna ulaştı. Güven seviyesi yüksek.',
      };
    } else if (majority?.[1] === 2) {
      verdict = {
        icon: 'fa-handshake-angle',
        text: `Çoğunluk kararı: ${majority[0]}`,
        sub: `Gemini: ${results.gemini?.sentiment} - Llama: ${results.llama?.sentiment} - DeepSeek: ${results.deepseek?.sentiment}`,
      };
    } else {
      verdict = {
        icon: 'fa-triangle-exclamation',
        text: 'Modeller farklı yorumladı',
        sub: `Gemini: ${results.gemini?.sentiment} - Llama: ${results.llama?.sentiment} - DeepSeek: ${results.deepseek?.sentiment}`,
      };
    }
  }

  return (
    <>
      <div className="page-intro page-intro-compact">
        <div>
          <div className="page-eyebrow">Model Karşılaştırma</div>
          <h1 className="page-intro-title">3 LLM modelini aynı yorum üzerinde karşılaştır</h1>
          <p className="page-intro-sub">
            Aynı girdiyi paralel işle, duygu farklarını gör ve istersen seçili sonucu kaydet.
          </p>
        </div>
      </div>

      <section className="flow-visual-panel compare-visual">
        <div className="flow-visual-copy">
          <span className="flow-visual-kicker">Model görünümü</span>
          <h2>Aynı yorumu üç farklı model gözünden değerlendir.</h2>
          <p>
            Gemini, Llama ve DeepSeek çıktıları tek sahnede görünsün; hemfikir oldukları ve ayrıştıkları
            noktalar ilk bakışta seçilebilsin.
          </p>
        </div>
        <div className="compare-visual-stack">
          <div className="compare-visual-chip">Gemini • Pozitif</div>
          <div className="compare-visual-chip">Llama • Nötr</div>
          <div className="compare-visual-chip">DeepSeek • Negatif</div>
        </div>
      </section>

      <div className="card compare-input-card work-card">
        <div className="section-kicker">Prompt</div>
        <div className="card-title compare-title-gap"><i className="fas fa-comment-dots" /> Karşılaştırılacak yorum</div>
        <p className="compare-help">Aynı yorumun 3 farklı LLM modeli tarafından nasıl değerlendirildiğini tek ekranda gör.</p>
        <div className="form-group">
          <label className="form-label">Müşteri yorumu</label>
          <textarea className="form-control" rows={5} placeholder="Örnek: Ürün beklediğimden çok geç geldi ve paket hasarlıydı." value={comment} onChange={(event) => setComment(event.target.value)} />
        </div>
        <div className="form-group compare-tone-select">
          <label className="form-label">Cevap tonu</label>
          <select className="form-control" value={tone} onChange={(event) => setTone(event.target.value)}>
            <option>Kibar</option>
            <option>Kurumsal</option>
            <option>Esprili</option>
            <option>Agresif</option>
          </select>
        </div>
        <button className="btn btn-primary btn-lg btn-full" onClick={doCompare} disabled={state === 'loading'}>
          {state === 'loading' ? <><i className="fas fa-spinner spin" /> Modeller analiz ediyor...</> : <><i className="fas fa-bolt" /> 3 modeli aynı anda karşılaştır</>}
        </button>
      </div>

      {state === 'loading' && (
        <div className="card compare-loading-card">
          <div className="loading-dots compare-loading-dots"><span /><span /><span /></div>
          <div className="loading-title">3 model paralel analiz ediyor...</div>
          <div className="loading-sub">Gemini 2.5 - Groq Llama 3.3 - DeepSeek-R1</div>
        </div>
      )}

      {state === 'result' && (
        <>
          <div className="compare-grid">
            {[
              { key: 'gemini', label: 'Gemini 2.5', pill: 'mp-gemini', top: 'compare-top-gem', provider: 'Google' },
              { key: 'llama', label: 'Groq Llama 3.3', pill: 'mp-llama', top: 'compare-top-lla', provider: 'Groq' },
              { key: 'deepseek', label: 'DeepSeek-R1', pill: 'mp-deepseek', top: 'compare-top-dsk', provider: 'DeepSeek' },
            ].map((item) => (
              <div key={item.key} className={`compare-card ${item.top}`}>
                <div className="compare-card-header">
                  <span className={`model-pill ${item.pill}`}>{item.label}</span>
                  <h3>{item.provider}</h3>
                </div>
                <ModelCard data={results[item.key]} />
              </div>
            ))}
          </div>

          {verdict && (
            <div className="verdict-box">
              <div className="verdict-emoji"><i className={`fas ${verdict.icon}`} /></div>
              <div className="verdict-text">{verdict.text}</div>
              <div className="verdict-sub">{verdict.sub}</div>
            </div>
          )}

          <div className="card">
            <div className="card-title card-title-space"><i className="fas fa-floppy-disk" /> Sonucu kaydet</div>
            <div className="header-actions">
              <button className="btn btn-ghost" onClick={() => saveModel('gemini')}>Gemini sonucunu kaydet</button>
              <button className="btn btn-ghost" onClick={() => saveModel('llama')}>Llama sonucunu kaydet</button>
              <button className="btn btn-ghost" onClick={() => saveModel('deepseek')}>DeepSeek sonucunu kaydet</button>
            </div>
            {saveMessage && <div className="alert alert-success compare-save-alert"><i className="fas fa-check-circle" /> {saveMessage}</div>}
          </div>
        </>
      )}
    </>
  );
}
