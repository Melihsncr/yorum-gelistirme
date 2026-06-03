import { Router } from 'express';
import ExcelJS from 'exceljs';
import { fetchAll } from '../config/db.js';

const router = Router();

router.get('/export/csv', async (_req, res) => {
  const rows = await fetchAll();
  const headers = ['id', 'date', 'model', 'comment', 'sentiment', 'category', 'summary', 'reply'];

  const lines = [
    '\uFEFF' + headers.join(','),
    ...rows.map((row) => (
      headers.map((header) => `"${String(row[header] ?? '').replace(/"/g, '""')}"`).join(',')
    )),
  ];

  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="crm_${date}.csv"`);
  res.send(lines.join('\n'));
});

router.get('/export/excel', async (_req, res) => {
  const rows = await fetchAll();
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('CRM Analizleri');

  worksheet.columns = [
    { header: 'ID', key: 'id', width: 8 },
    { header: 'Tarih', key: 'date', width: 22 },
    { header: 'Model', key: 'model', width: 26 },
    { header: 'Yorum', key: 'comment', width: 44 },
    { header: 'Duygu', key: 'sentiment', width: 13 },
    { header: 'Kategori', key: 'category', width: 22 },
    { header: 'Ozet', key: 'summary', width: 44 },
    { header: 'Cevap', key: 'reply', width: 52 },
  ];

  worksheet.getRow(1).font = { bold: true };
  worksheet.addRows(rows.map((row) => ({
    ...row,
    date: new Date(row.date).toLocaleString('tr-TR'),
  })));

  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="crm_${date}.xlsx"`);
  await workbook.xlsx.write(res);
  res.end();
});

export default router;
