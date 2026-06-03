import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Analyze   from './pages/Analyze.jsx';
import Bulk      from './pages/Bulk.jsx';
import Compare   from './pages/Compare.jsx';
import History   from './pages/History.jsx';
import Auth      from './pages/Auth.jsx';
import Pricing   from './pages/Pricing.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index             element={<Dashboard />} />
          <Route path="analyze"    element={<Analyze />}   />
          <Route path="bulk"       element={<Bulk />}      />
          <Route path="compare"    element={<Compare />}   />
          <Route path="history"    element={<History />}   />
          <Route path="auth"       element={<Auth />}      />
          <Route path="pricing"    element={<Pricing />}   />
          <Route path="*"          element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
