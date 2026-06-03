import { Router } from 'express';
import { analyzeComment, MODEL_NAMES, getApiStatus } from '../services/llmService.js';
import { saveLog, deleteAll } from '../config/db.js';

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

router.post('/compare', async (req, res) => {
  try {
    const { comment, tone = 'Kibar' } = req.body;
    if (!comment?.trim()) {
      return res.status(400).json({ error: 'Yorum boş olamaz' });
    }

    const [gemini, llama, deepseek] = await Promise.all([
      analyzeComment(comment.trim(), tone, 'gemini'),
      analyzeComment(comment.trim(), tone, 'llama'),
      analyzeComment(comment.trim(), tone, 'deepseek'),
    ]);

    res.json({ gemini, llama, deepseek });
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
