import { getToken } from '../utils/auth.js';

const BASE = import.meta.env.VITE_API_URL || '';

async function request(method, path, body, isForm = false) {
  const token = getToken();
  const opts = { method, headers: {} };

  if (token) {
    opts.headers.Authorization = `Bearer ${token}`;
  }

  if (body) {
    if (isForm) {
      opts.body = body;
    } else {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
  }

  const res = await fetch(`${BASE}/api${path}`, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Sunucu hatası');
  }

  return res.json();
}

export const api = {
  getStats: () => request('GET', '/stats'),
  getHistory: (params = {}) => request('GET', `/history?${new URLSearchParams(params)}`),
  getStatus: () => request('GET', '/status'),
  analyze: (data) => request('POST', '/analyze', data),
  compare: (data) => request('POST', '/compare', data),
  save: (data) => request('POST', '/save', data),
  reset: () => request('POST', '/reset'),
  bulk: (form) => request('POST', '/bulk', form, true),
  createCheckout: (data) => request('POST', '/payments/checkout', data),
  signup: (data) => request('POST', '/auth/signup', data),
  login: (data) => request('POST', '/auth/login', data),
  getMe: () => request('GET', '/auth/me'),
  exportCsv: () => `${BASE}/api/export/csv`,
  exportExcel: () => `${BASE}/api/export/excel`,
};
