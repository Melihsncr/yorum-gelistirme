import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const DEFAULT_ACTIONS = [
  {
    key: 'analyze',
    title: 'Tek yorum analizi',
    description: 'Bir yorumu anında inceleyip cevap önerisi üret.',
    path: '/analyze',
    icon: 'fa-comment-dots',
    reply: 'Tek yorum akışı en hızlı başlangıç. Seni analiz ekranına götürüyorum.',
  },
  {
    key: 'bulk',
    title: 'Toplu CSV analizi',
    description: 'Yorum dosyasını yükleyip toplu işlem başlat.',
    path: '/bulk',
    icon: 'fa-file-csv',
    reply: 'Toplu akış seçildi. CSV yükleme ekranına geçiyoruz.',
  },
  {
    key: 'compare',
    title: 'Model karşılaştırma',
    description: 'Gemini, Llama ve OpenRouter çıktılarını yan yana gör.',
    path: '/compare',
    icon: 'fa-layer-group',
    reply: 'Farklı model cevaplarını karşılaştırmak için uygun ekrana gidiyoruz.',
  },
  {
    key: 'pricing',
    title: 'Planları incele',
    description: 'Free, Pro ve Pro Max seçeneklerini gör.',
    path: '/pricing',
    icon: 'fa-credit-card',
    reply: 'Planları birlikte kontrol edelim. Ücretlendirme sayfasını açıyorum.',
  },
];

const PAGE_HINTS = {
  '/': 'Tekli işlem mi toplu işlem mi yapmak istiyorsun? Sana uygun akışı hemen açabilirim.',
  '/analyze': 'Burada tek yorumu hızlıca analiz edebilirsin. İstersen toplu akışa da geçirebilirim.',
  '/bulk': 'CSV dosyan hazırsa toplu analiz burada başlar. Örnek dosya yapısını da hatırlatabilirim.',
  '/compare': 'Aynı yorumu birden fazla modelle karşılaştırmak için doğru yerdesin.',
  '/history': 'Eski analizleri inceleyebilir, sonra tekli veya toplu akışa dönebilirsin.',
  '/pricing': 'Plan seçiminde takılırsan ihtiyacına göre yönlendirebilirim.',
};

function BotAvatar({ compact = false }) {
  return (
    <div className={`assistant-bot-face${compact ? ' compact' : ''}`} aria-hidden="true">
      <span className="assistant-bot-eye left" />
      <span className="assistant-bot-eye right" />
      <span className="assistant-bot-smile" />
      {!compact && <span className="assistant-bot-glow" />}
    </div>
  );
}

export default function AssistantWidget() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);

  const helperText = PAGE_HINTS[location.pathname] || PAGE_HINTS['/'];

  const actions = useMemo(() => {
    if (location.pathname === '/analyze') {
      return DEFAULT_ACTIONS.filter((item) => item.key !== 'analyze');
    }

    if (location.pathname === '/bulk') {
      return DEFAULT_ACTIONS.filter((item) => item.key !== 'bulk');
    }

    if (location.pathname === '/compare') {
      return DEFAULT_ACTIONS.filter((item) => item.key !== 'compare');
    }

    if (location.pathname === '/pricing') {
      return DEFAULT_ACTIONS.filter((item) => item.key !== 'pricing');
    }

    return DEFAULT_ACTIONS;
  }, [location.pathname]);

  function handleAction(action) {
    setSelectedAction(action);
    navigate(action.path);
  }

  if (location.pathname === '/auth') {
    return null;
  }

  return (
    <div className={`assistant-widget${open ? ' open' : ''}`}>
      {open && (
        <section className="assistant-panel" aria-label="Yorum asistanı">
          <div className="assistant-panel-header">
            <div className="assistant-header-copy">
              <div className="assistant-avatar" aria-hidden="true">
                <BotAvatar />
              </div>
              <div>
                <span className="assistant-kicker">Akıllı yardımcı</span>
                <strong>Yorum Asistanı</strong>
              </div>
            </div>
            <button
              type="button"
              className="assistant-close-btn"
              onClick={() => setOpen(false)}
              aria-label="Asistanı kapat"
            >
              <i className="fas fa-xmark" />
            </button>
          </div>

          <div className="assistant-thread">
            <div className="assistant-bubble assistant-bubble-bot">
              <div className="assistant-bubble-avatar" aria-hidden="true">
                <BotAvatar compact />
              </div>
              <p>{helperText}</p>
            </div>

            {selectedAction && (
              <>
                <div className="assistant-bubble assistant-bubble-user">
                  <span>{selectedAction.title}</span>
                </div>
                <div className="assistant-bubble assistant-bubble-bot compact">
                  <p>{selectedAction.reply}</p>
                </div>
              </>
            )}
          </div>

          <div className="assistant-actions">
            {actions.map((action) => (
              <button
                key={action.key}
                type="button"
                className="assistant-action-card"
                onClick={() => handleAction(action)}
              >
                <i className={`fas ${action.icon}`} />
                <div>
                  <strong>{action.title}</strong>
                  <span>{action.description}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="assistant-footer-note">
            İstersen önce tek yorumla başlayıp sonra toplu akışa geçebilirsin.
          </div>
        </section>
      )}

      <button
        type="button"
        className="assistant-launcher"
        onClick={() => setOpen((value) => !value)}
        aria-label="Yorum asistanı aç"
      >
        <span className="assistant-launcher-icon">
          <BotAvatar compact />
        </span>
        <span className="assistant-launcher-copy">
          <strong>Yardımcı Bot</strong>
          <small>Ne yapmak istiyorsun?</small>
        </span>
      </button>
    </div>
  );
}
