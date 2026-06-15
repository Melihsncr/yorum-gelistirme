import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';
import Footer from './Footer.jsx';
import AssistantWidget from './AssistantWidget.jsx';
import { api } from '../api/client.js';
import { clearSession, getStoredUser } from '../utils/auth.js';

export default function Layout() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [apiStatus, setApiStatus] = useState({ gemini: false, llama: false, openrouter: false });
  const [user, setUser] = useState(getStoredUser());

  useEffect(() => {
    api.getStatus().then(setApiStatus).catch(() => {});
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    api.getMe()
      .then((data) => setUser(data.user))
      .catch(() => {
        clearSession();
        setUser(null);
      });
  }, []);

  function handleLogout() {
    clearSession();
    setUser(null);
    window.location.href = '/';
  }

  return (
    <div className="layout">
      <Sidebar open={open} onClose={() => setOpen(false)} apiStatus={apiStatus} />
      <div className={`sidebar-overlay${open ? ' active' : ''}`} onClick={() => setOpen(false)} aria-hidden="true" />
      <div className="main">
        <Topbar
          apiStatus={apiStatus}
          onHamburger={() => setOpen((value) => !value)}
          user={user}
          onLogout={handleLogout}
        />
        <main className="page">
          <div className="page-shell">
            <Outlet context={{ user, setUser }} />
          </div>
        </main>
        <AssistantWidget />
        <Footer />
      </div>
    </div>
  );
}
