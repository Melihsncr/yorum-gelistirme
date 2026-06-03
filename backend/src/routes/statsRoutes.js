import { Router } from 'express';
import { fetchAll } from '../config/db.js';

const router = Router();

router.get('/stats', async (_req, res) => {
  const rows = await fetchAll();

  if (!rows.length) {
    return res.json({
      total: 0,
      positive: 0,
      negative: 0,
      neutral: 0,
      sentiment_dist: {},
      category_dist: {},
      model_dist: {},
      time_series: [],
      recent: [],
    });
  }

  const sentimentDist = {};
  const categoryDist = {};
  const modelDist = {};
  const timeSeriesMap = {};

  for (const row of rows) {
    sentimentDist[row.sentiment] = (sentimentDist[row.sentiment] || 0) + 1;
    categoryDist[row.category] = (categoryDist[row.category] || 0) + 1;
    modelDist[row.model] = (modelDist[row.model] || 0) + 1;

    const dateStr = new Date(row.date).toISOString().split('T')[0];
    if (!timeSeriesMap[dateStr]) {
      timeSeriesMap[dateStr] = { Pozitif: 0, Negatif: 0, 'Nötr': 0 };
    }
    timeSeriesMap[dateStr][row.sentiment] = (timeSeriesMap[dateStr][row.sentiment] || 0) + 1;
  }

  const timeSeries = Object.entries(timeSeriesMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, counts]) => ({
      date,
      Pozitif: counts.Pozitif || 0,
      Negatif: counts.Negatif || 0,
      'Nötr': counts['Nötr'] || 0,
    }));

  const recent = rows.slice(0, 8).map(({ date, model, sentiment, category, summary }) => ({
    date: new Date(date).toLocaleString('tr-TR'),
    model,
    sentiment,
    category,
    summary,
  }));

  res.json({
    total: rows.length,
    positive: sentimentDist.Pozitif || 0,
    negative: sentimentDist.Negatif || 0,
    neutral: sentimentDist['Nötr'] || 0,
    sentiment_dist: sentimentDist,
    category_dist: categoryDist,
    model_dist: modelDist,
    time_series: timeSeries,
    recent,
  });
});

router.get('/history', async (req, res) => {
  const { search, sentiment, category } = req.query;
  let rows = await fetchAll();

  if (search) {
    rows = rows.filter((row) => (
      row.comment?.toLowerCase().includes(search.toLowerCase())
      || row.summary?.toLowerCase().includes(search.toLowerCase())
    ));
  }

  if (sentiment) {
    rows = rows.filter((row) => row.sentiment === sentiment);
  }

  if (category) {
    rows = rows.filter((row) => row.category === category);
  }

  res.json(rows.map((row) => ({
    ...row,
    date: new Date(row.date).toLocaleString('tr-TR'),
  })));
});

export default router;
