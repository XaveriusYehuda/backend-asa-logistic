const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Sesuaikan dengan konfigurasi koneksi mysql2 Anda

// 1. Ambil Jumlah/Statistik Data
router.get('/stats', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        SUM(CASE WHEN status_request = 'incoming' THEN 1 ELSE 0 END) as incoming,
        SUM(CASE WHEN status_request = 'ongoing' THEN 1 ELSE 0 END) as ongoing,
        SUM(CASE WHEN status_request = 'completed' THEN 1 ELSE 0 END) as completed
      FROM rfq_requests
    `);
    res.json(rows[0] || { incoming: 0, ongoing: 0, completed: 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Ambil 5 Data Pertama/Terbaru dari Masing-Masing Status
router.get('/requests', async (req, res) => {
  try {
    // Menggunakan JSON_UNQUOTE / operator ->> untuk mengambil data dari kolom JSON service_details
    const queryStr = (status) => `
      SELECT 
        user_id, 
        rfq_number,
        JSON_UNQUOTE(JSON_EXTRACT(service_details, '$.company_name')) as company_name,
        JSON_UNQUOTE(JSON_EXTRACT(service_details, '$.pic_name')) as client_name,
        status_request
      FROM rfq_requests 
      WHERE status_request = '${status}'
      ORDER BY created_at DESC 
      LIMIT 5
    `;

    const [incoming] = await db.query(queryStr('incoming'));
    const [ongoing] = await db.query(queryStr('ongoing'));
    const [completed] = await db.query(queryStr('completed'));

    res.json({ incoming, ongoing, completed });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Update Status Request (Otomatis memperbarui updated_at)
router.put('/update-status', async (req, res) => {
  const { rfq_number, nextStatus } = req.body; // id disini menggunakan `id` internal atau `rfq_number` (sebagai pengganti public_id)
  
  if (!['incoming', 'ongoing', 'completed'].includes(nextStatus)) {
    return res.status(400).json({ error: 'Status tidak valid' });
  }

  try {
    await db.query(
      'UPDATE rfq_requests SET status_request = ? WHERE rfq_number = ?',
      [nextStatus, rfq_number]
    );
    res.json({ message: `Status berhasil diperbarui menjadi ${nextStatus}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;