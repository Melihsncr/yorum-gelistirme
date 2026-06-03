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

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type'],
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
      console.log(`✅ Sunucu calisiyor: http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Veritabani baslatilamadi:', err.message);
    process.exit(1);
  });
