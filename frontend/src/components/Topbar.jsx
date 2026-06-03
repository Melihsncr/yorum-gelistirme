import { NavLink } from 'react-router-dom';
import siteLogo from '../assets/site-logo.png';

const NAV_ITEMS = [
  { to: '/', label: 'Ürün' },
  { to: '/analyze', label: 'Analiz' },
  { to: '/bulk', label: 'Toplu İşlem' },
  { to: '/compare', label: 'Modeller' },
  { to: '/history', label: 'Geçmiş' },
  { to: '/pricing', label: 'Ücretlendirme' },
];

export default function Topbar({ onHamburger, user, onLogout }) {
  return (
    <header className="topbar topbar-linear">
      <div className="topbar-brand">
        <button className="hamburger" onClick={onHamburger} aria-label="Menüyü aç">
          <i className="fas fa-bars" />
        </button>

        <NavLink to="/" className="topbar-brand-link" aria-label="Ana sayfa">
          <img src={siteLogo} alt="Yorum Geliştirme logosu" className="topbar-brand-image" />
          <span className="topbar-brand-name">Yorum Geliştirme</span>
        </NavLink>
      </div>

      <nav className="topbar-nav topbar-nav-linear">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `topbar-nav-link${isActive ? ' active' : ''}`}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="topbar-actions">
        {user ? (
          <>
            <span className="topbar-user-pill">{user.fullName}</span>
            <button type="button" className="topbar-link-btn" onClick={onLogout}>Çıkış yap</button>
          </>
        ) : (
          <>
            <NavLink to="/auth?mode=login" className="topbar-link-btn">Giriş yap</NavLink>
            <NavLink to="/auth?mode=signup" className="topbar-cta">Kayıt ol</NavLink>
          </>
        )}
      </div>
    </header>
  );
}
