import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/', icon: 'fa-chart-line', label: 'Dashboard', hint: 'Genel durum' },
  { to: '/analyze', icon: 'fa-magnifying-glass-chart', label: 'Tek Analiz', hint: 'Tek yorum akışı' },
  { to: '/bulk', icon: 'fa-file-csv', label: 'Toplu Analiz', hint: 'CSV işlemleri' },
  { to: '/compare', icon: 'fa-scale-balanced', label: 'Model Karşılaştır', hint: 'LLM karşılaştırması' },
  { to: '/history', icon: 'fa-clock-rotate-left', label: 'Geçmiş', hint: 'Kayıt geçmişi' },
];

const MODELS = [
  { key: 'gemini', label: 'Gemini' },
  { key: 'llama', label: 'Llama' },
  { key: 'deepseek', label: 'DeepSeek' },
];

export default function Sidebar({ open, onClose, apiStatus = {} }) {
  const onlineCount = MODELS.filter((item) => apiStatus[item.key]).length;

  return (
    <aside className={`sidebar${open ? ' open' : ''}`}>
      <div className="sidebar-logo">
        <div className="logo-icon"><i className="fas fa-comments" /></div>
        <div>
          <div className="logo-text">Yorum<span>Analizi</span></div>
          <div className="logo-sub">LLM destekli yorum geliştirme alanı</div>
        </div>
      </div>

      <div className="sidebar-workspace">
        <div className="workspace-chip">
          <span className="workspace-dot" />
          Canlı proje alanı
        </div>
        <div className="workspace-meta">
          <strong>Yorum Operasyon Merkezi</strong>
          <span>Linear düzeni, Mixpanel veri akışı</span>
        </div>
      </div>

      <div className="sidebar-section-label">Akışlar</div>
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            onClick={onClose}
          >
            <i className={`fas ${item.icon}`} />
            <div className="nav-copy">
              <span>{item.label}</span>
              <small>{item.hint}</small>
            </div>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-section-label sidebar-section-small">Canlı sistemler</div>
        <div className="api-summary">
          <strong>{onlineCount}/3 model hazır</strong>
          <span>Yerel PostgreSQL ve API aktif</span>
        </div>
        <div className="api-status">
          {MODELS.map((model) => (
            <div key={model.key} className="api-row">
              <span>{model.label}</span>
              <div className={`api-pill ${apiStatus[model.key] ? 'on' : 'off'}`}>
                <span className={`api-dot ${apiStatus[model.key] ? 'on' : 'off'}`} />
                {apiStatus[model.key] ? 'Online' : 'Offline'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
