import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const DEFAULT_ACTIONS = [
  {
    key: 'analyze',
    title: 'Tek yorum analizi',
    description: 'Bir yorumu aninda inceleyip cevap onerisi uret.',
    path: '/analyze',
    icon: 'fa-comment-dots',
    reply: 'Tek yorum akisi en hizli baslangic. Seni analiz ekranina goturuyorum.',
  },
  {
    key: 'bulk',
    title: 'Toplu CSV analizi',
    description: 'Yorum dosyasini yukleyip toplu islem baslat.',
    path: '/bulk',
    icon: 'fa-file-csv',
    reply: 'Toplu akis secildi. CSV yukleme ekranina geciyoruz.',
  },
  {
    key: 'compare',
    title: 'Model karsilastirma',
    description: 'Gemini, Llama ve OpenRouter ciktilarini yan yana gor.',
    path: '/compare',
    icon: 'fa-layer-group',
    reply: 'Farkli model cevaplarini karsilastirmak icin uygun ekrana gidiyoruz.',
  },
  {
    key: 'pricing',
    title: 'Planlari incele',
    description: 'Free, Pro ve Pro Max seceneklerini gor.',
    path: '/pricing',
    icon: 'fa-credit-card',
    reply: 'Planlari birlikte kontrol edelim. Ucretlendirme sayfasini aciyorum.',
  },
];

const PAGE_HINTS = {
  '/': 'Tekli islem mi toplu islem mi yapmak istiyorsun? Sana uygun akisi hemen acabilirim.',
  '/analyze': 'Burada tek yorumu hizlica analiz edebilirsin. Istersen toplu akisa da gecirebilirim.',
  '/bulk': 'CSV dosyan hazirsa toplu analiz burada baslar. Ornek dosya yapisini da hatirlatabilirim.',
  '/compare': 'Ayni yorumu birden fazla modelle karsilastirmak icin dogru yerdesin.',
  '/history': 'Eski analizleri inceleyebilir, sonra tekli veya toplu akisa donebilirsin.',
  '/pricing': 'Plan seciminde takilirsan ihtiyacina gore yonlendirebilirim.',
};

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
        <section className="assistant-panel" aria-label="Yorum asistani">
          <div className="assistant-panel-header">
            <div>
              <span className="assistant-kicker">Akilli yardimci</span>
              <strong>Yorum Asistani</strong>
            </div>
            <button
              type="button"
              className="assistant-close-btn"
              onClick={() => setOpen(false)}
              aria-label="Asistani kapat"
            >
              <i className="fas fa-xmark" />
            </button>
          </div>

          <div className="assistant-thread">
            <div className="assistant-bubble assistant-bubble-bot">
              <i className="fas fa-sparkles assistant-bubble-icon" />
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
            Istersen once tek yorumla baslayip sonra toplu akisa gecebilirsin.
          </div>
        </section>
      )}

      <button
        type="button"
        className="assistant-launcher"
        onClick={() => setOpen((value) => !value)}
        aria-label="Yorum asistani ac"
      >
        <span className="assistant-launcher-icon">
          <i className="fas fa-comment-dots" />
        </span>
        <span className="assistant-launcher-copy">
          <strong>Yardimci Bot</strong>
          <small>Ne yapmak istiyorsun?</small>
        </span>
      </button>
    </div>
  );
}
