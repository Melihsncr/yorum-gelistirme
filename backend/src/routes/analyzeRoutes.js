import { Router } from 'express';
import { analyzeComment, MODEL_NAMES, getApiStatus } from '../services/llmService.js';
import { saveLog, deleteAll } from '../config/db.js';
import { fetchProductReviews } from '../services/productReviewService.js';

const router = Router();

router.get('/status', (_req, res) => {
  res.json(getApiStatus());
});

router.post('/analyze', async (req, res) => {
  try {
    const { comment, tone = 'Kibar', model: modelKey = 'gemini' } = req.body;
    if (!comment?.trim()) {
      return res.status(400).json({ error: 'Yorum boş olamaz' });
    }

    const result = await analyzeComment(comment.trim(), tone, modelKey);
    if (!result.error) {
      await saveLog({
        model: MODEL_NAMES[modelKey] || modelKey,
        comment: comment.trim(),
        sentiment: result.sentiment,
        category: result.category,
        summary: result.summary,
        reply: result.reply,
      });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Analiz sırasında hata oluştu' });
  }
});

router.post('/analyze/product-preview', async (req, res) => {
  try {
    const { productUrl = '', maxReviews = 10 } = req.body || {};

    if (!productUrl.trim()) {
      return res.status(400).json({ error: 'Ürün linki boş olamaz.' });
    }

    const safeMaxReviews = Math.min(Math.max(Number(maxReviews) || 10, 1), 10);
    const productData = await fetchProductReviews(productUrl.trim(), {
      maxReviews: safeMaxReviews,
      maxPages: 3,
    });

    res.json({
      source: productData.platform,
      productRef: productData.productRef,
      imported: productData.reviews.length,
      scraper: productData.scraper || 'unknown',
      scraperWarning: productData.scraperWarning || '',
      reviews: productData.reviews.slice(0, safeMaxReviews),
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Ürün yorumları alınamadı.' });
  }
});

router.post('/compare', async (req, res) => {
  try {
    const { comment, tone = 'Kibar' } = req.body;
    if (!comment?.trim()) {
      return res.status(400).json({ error: 'Yorum boş olamaz' });
    }

    const [gemini, llama, openrouter] = await Promise.all([
      analyzeComment(comment.trim(), tone, 'gemini'),
      analyzeComment(comment.trim(), tone, 'llama'),
      analyzeComment(comment.trim(), tone, 'openrouter'),
    ]);

    res.json({ gemini, llama, openrouter });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Karşılaştırma sırasında hata oluştu' });
  }
});

router.post('/save', async (req, res) => {
  const { model, comment, sentiment, category, summary, reply } = req.body;
  await saveLog({ model, comment, sentiment, category, summary, reply });
  res.json({ success: true });
});

router.post('/reset', async (_req, res) => {
  await deleteAll();
  res.json({ success: true });
});

export default router;
