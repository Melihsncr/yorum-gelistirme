import { Router } from 'express';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import { analyzeComment, MODEL_NAMES } from '../services/llmService.js';
import { saveLog } from '../config/db.js';
import { fetchProductReviews } from '../services/productReviewService.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
      return;
    }

    cb(new Error('Sadece .csv dosyasi kabul edilir'));
  },
});

async function analyzeComments(comments, tone, modelKey) {
  const results = [];
  const batch = comments.slice(0, 500);

  for (const comment of batch) {
    const result = await analyzeComment(comment, tone, modelKey);
    if (!result.error) {
      await saveLog({
        model: MODEL_NAMES[modelKey] || modelKey,
        comment,
        sentiment: result.sentiment,
        category: result.category,
        summary: result.summary,
        reply: result.reply,
      });

      results.push({
        yorum: comment,
        duygu: result.sentiment,
        kategori: result.category,
        ozet: result.summary,
        cevap: result.reply,
      });
    } else {
      results.push({
        yorum: comment,
        duygu: 'Hata',
        kategori: '-',
        ozet: result.error,
        cevap: '-',
      });
    }
  }

  return results;
}

router.post('/bulk', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Dosya bulunamadi' });
  }

  const tone = req.body.tone || 'Kibar';
  const modelKey = req.body.model || 'gemini';

  let records;
  try {
    records = parse(req.file.buffer, {
      columns: true,
      skip_empty_lines: true,
      bom: true,
      trim: true,
    });
  } catch {
    return res.status(400).json({ error: 'CSV dosyasi okunamadi. UTF-8 formatinda oldugundan emin olun.' });
  }

  if (!records.length || !Object.keys(records[0]).some((key) => key.trim().toLowerCase() === 'yorum')) {
    return res.status(400).json({ error: "'yorum' sutunu bulunamadi. Sutun adi tam olarak 'yorum' olmali." });
  }

  const comments = records
    .slice(0, 500)
    .map((record) => {
      const yorumKey = Object.keys(record).find((key) => key.trim().toLowerCase() === 'yorum');
      return String(record[yorumKey] || '').trim();
    })
    .filter(Boolean);

  const results = await analyzeComments(comments, tone, modelKey);

  res.json({ results, total: results.length });
});

router.post('/bulk/product', async (req, res) => {
  try {
    const {
      productUrl = '',
      tone = 'Kibar',
      model = 'gemini',
      maxReviews = 30,
    } = req.body || {};

    if (!productUrl.trim()) {
      return res.status(400).json({ error: 'Ürün linki zorunludur.' });
    }

    const productData = await fetchProductReviews(productUrl.trim(), {
      maxReviews,
      maxPages: 4,
    });

    const results = await analyzeComments(productData.reviews, tone, model);

    res.json({
      results,
      total: results.length,
      source: productData.platform,
      productRef: productData.productRef,
      imported: productData.reviews.length,
      scraper: productData.scraper || 'unknown',
      scraperWarning: productData.scraperWarning || '',
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Ürün yorumları alınırken hata oluştu.' });
  }
});

export default router;
