import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initDb } from './config/db.js';
import analyzeRoutes from './routes/analyzeRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import bulkRoutes from './routes/bulkRoutes.js';
import exportRoutes from './routes/exportRoutes.js';
import paymentsRoutes from './routes/paymentsRoutes.js';
import authRoutes from './routes/authRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;
const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'https://yorum-gelistirme.vercel.app',
  'https://www.yorumgelistirme.it.com',
  'https://yorumgelistirme.it.com',
];

function getAllowedOrigins() {
  const envOrigins = [
    process.env.FRONTEND_URL,
    process.env.FRONTEND_URLS,
  ]
    .filter(Boolean)
    .flatMap((value) => value.split(','))
    .map((value) => value.trim().replace(/\/$/, ''))
    .filter(Boolean);

  return [...new Set([...DEFAULT_ALLOWED_ORIGINS, ...envOrigins])];
}

const allowedOrigins = getAllowedOrigins();

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin.replace(/\/$/, ''))) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS engeli: ${origin}`));
  },
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api', analyzeRoutes);
app.use('/api', statsRoutes);
app.use('/api', bulkRoutes);
app.use('/api', exportRoutes);
app.use('/api', paymentsRoutes);
app.use('/api', authRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Sunucu hatasi' });
});

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(` Sunucu calisiyor: http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error(' Veritabani baslatilamadi:', err.message);
    process.exit(1);
  });
