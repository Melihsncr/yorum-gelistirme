import { Router } from 'express';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import { analyzeComment, MODEL_NAMES } from '../services/llmService.js';
import { saveLog } from '../config/db.js';

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

  const results = [];
  const batch = records.slice(0, 500);

  for (const record of batch) {
    const yorumKey = Object.keys(record).find((key) => key.trim().toLowerCase() === 'yorum');
    const comment = String(record[yorumKey] || '').trim();
    if (!comment) continue;

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

  res.json({ results, total: results.length });
});

export default router;
