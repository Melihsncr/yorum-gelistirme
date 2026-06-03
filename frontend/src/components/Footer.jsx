import { Link } from 'react-router-dom';
import siteLogo from '../assets/site-logo.png';

const GROUPS = [
  {
    title: 'Ürün',
    items: ['Tek Yorum Analizi', 'Toplu CSV', 'Model Karşılaştırma', 'Analiz Geçmişi'],
  },
  {
    title: 'Özellikler',
    items: ['Duygu Tespiti', 'Kategori Etiketleme', 'Önerilen Cevap', 'CSV / Excel Çıktı'],
  },
  {
    title: 'Kurum',
    items: ['Cumhuriyet Üniversitesi', 'Mühendislik Fakültesi', 'Bitirme Projesi', 'LLM Uygulaması'],
  },
  {
    title: 'Ekip',
    items: ['Melih Sancar', 'Enes Şamlı', 'Ömer Yıldız', 'Yorum geliştirme ekibi'],
  },
];

export default function Footer() {
  return (
    <footer className="linear-footer">
      <div className="linear-footer-cta">
        <div className="linear-footer-cta-actions">
          <Link to="/analyze" className="topbar-cta">Analize Başla</Link>
          <Link to="/history" className="linear-footer-secondary">Tüm Geçmişi Gör</Link>
        </div>
      </div>

      <div className="linear-footer-grid">
        <div className="linear-footer-brand">
          <img src={siteLogo} alt="Yorum Geliştirme logosu" className="footer-brand-image" />
        </div>

        {GROUPS.map((group) => (
          <div key={group.title} className="linear-footer-col">
            <h4>{group.title}</h4>
            <ul>
              {group.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </footer>
  );
}
