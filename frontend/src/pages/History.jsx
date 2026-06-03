import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client.js';

const SENTIMENT_CLASS = {
  Pozitif: 'badge-pos',
  Negatif: 'badge-neg',
  Nötr: 'badge-neu',
  Notr: 'badge-neu',
};

export default function History() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sentiment, setSentiment] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const PER_PAGE = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (sentiment) params.sentiment = sentiment;
      if (category) params.category = category;
      const data = await api.getHistory(params);
      setRows(data);
      setPage(1);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [search, sentiment, category]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
  const displayedRows = rows.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  function downloadCsv() {
    if (!rows.length) return;
    const keys = ['id', 'date', 'model', 'comment', 'sentiment', 'category', 'summary', 'reply'];
    const csv = ['\uFEFF' + keys.join(','), ...rows.map((row) => keys.map((key) => `"${String(row[key] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    Object.assign(document.createElement('a'), { href: url, download: 'gecmis.csv' }).click();
  }

  return (
    <div className="card">
      <div className="page-intro page-intro-compact page-intro-inline">
        <div>
          <div className="page-eyebrow">Geçmiş</div>
          <h1 className="page-intro-title">Analiz geçmişini filtrele ve dışa aktar</h1>
          <p className="page-intro-sub">
            Veritabanına kaydedilen sonuçları model, duygu ve kategori bazında incele.
          </p>
        </div>
      </div>

      <section className="flow-visual-panel history-visual">
        <div className="flow-visual-copy">
          <span className="flow-visual-kicker">Rapor görünümü</span>
          <h2>Geçmiş kayıtları filtrele, dışa aktar, kararları hızlandır.</h2>
          <p>
            Hangi model ne kadar kullanılmış, hangi kategoride yoğunlaşma olmuş ve hangi duygu öne
            çıkmış; hepsi tek bakışta görünür olsun.
          </p>
        </div>
        <div className="history-visual-timeline">
          <div><strong>Bugün</strong><span>34 analiz</span></div>
          <div><strong>Son 7 gün</strong><span>142 analiz</span></div>
          <div><strong>En yoğun kanal</strong><span>Trendyol</span></div>
        </div>
      </section>

      <div className="card-header">
        <div className="card-title"><i className="fas fa-clock-rotate-left" /> Analiz geçmişi</div>
        <div className="header-actions">
          <button className="btn btn-ghost" onClick={load}><i className="fas fa-rotate-right" /> Yenile</button>
          <button className="btn btn-ghost" onClick={downloadCsv}><i className="fas fa-download" /> CSV indir</button>
          <a href={api.exportCsv()} className="btn btn-ghost"><i className="fas fa-file-csv" /> Tüm CSV</a>
          <a href={api.exportExcel()} className="btn btn-ghost"><i className="fas fa-file-excel" /> Tüm Excel</a>
        </div>
      </div>

      <div className="history-filters">
        <div className="form-group search-input">
          <label className="form-label">Ara</label>
          <div className="search-wrap">
            <i className="fas fa-search search-icon" />
            <input className="form-control input-with-icon" placeholder="Yorum veya özet ara..." value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Duygu</label>
          <select className="form-control" value={sentiment} onChange={(event) => setSentiment(event.target.value)}>
            <option value="">Tümü</option>
            <option>Pozitif</option>
            <option>Negatif</option>
            <option>Nötr</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Kategori</label>
          <select className="form-control" value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="">Tümü</option>
            <option>Kargo</option>
            <option>Ürün Kalitesi</option>
            <option>Fiyat</option>
            <option>Müşteri Hizmetleri</option>
            <option>Genel</option>
          </select>
        </div>
        <div className="form-group filters-reset">
          <button className="btn btn-ghost" onClick={() => { setSearch(''); setSentiment(''); setCategory(''); }}>
            <i className="fas fa-xmark" /> Temizle
          </button>
        </div>
      </div>

      {loading ? (
        <div className="card-loading"><div className="loading-dots"><span /><span /><span /></div></div>
      ) : !rows.length ? (
        <div className="empty"><i className="fas fa-inbox" /><h3>Kayıt bulunamadı</h3><p>Filtreleri değiştir ya da yeni analizler oluştur.</p></div>
      ) : (
        <>
          <div className="history-count">{rows.length} kayıt bulundu</div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>ID</th><th>Tarih</th><th>Model</th><th>Yorum</th><th>Duygu</th><th>Kategori</th><th>Özet</th><th>Önerilen cevap</th></tr>
              </thead>
              <tbody>
                {displayedRows.map((row) => (
                  <tr key={row.id}>
                    <td className="muted-text">{row.id}</td>
                    <td className="td-nowrap">{row.date}</td>
                    <td>{row.model}</td>
                    <td className="truncate table-col-sm">{row.comment}</td>
                    <td><span className={`badge ${SENTIMENT_CLASS[row.sentiment] || 'badge-neu'}`}>{row.sentiment}</span></td>
                    <td><span className="badge badge-cat">{row.category}</span></td>
                    <td className="truncate table-col-md">{row.summary}</td>
                    <td className="truncate table-col-lg">{row.reply}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="pagination">
              <button className="btn btn-ghost" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1}><i className="fas fa-chevron-left" /></button>
              <span className="pagination-label">{page} / {totalPages}</span>
              <button className="btn btn-ghost" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page === totalPages}><i className="fas fa-chevron-right" /></button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
