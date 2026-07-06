// routes/worksheet.js
const express = require('express');
const router = express.Router();
const db = require('../config/db'); 

router.get('/rfq-request/:rfq_number', async (req, res) => {
  const { rfq_number } = req.params;

  try {
    const queryText = 'SELECT rfq_number, service_details FROM rfq_requests WHERE rfq_number = ?';
    const [rows] = await db.execute(queryText, [rfq_number]);

    // Jika data tidak ditemukan
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Data tidak ditemukan' });
    }

    const row = rows[0];

    // Pada MySQL, jika tipe data kolom berupa JSON, mysql2 otomatis mengubahnya jadi Object.
    // Namun jika disimpan sebagai String/Text biasa, kita perlu melakukan JSON.parse.
    const serviceDetails = typeof row.service_details === 'string' 
      ? JSON.parse(row.service_details) 
      : row.service_details;

    // Kirim response ke frontend
    res.json({
      rfqNumber: row.rfq_number,
      serviceDetails: serviceDetails
    });

  } catch (error) {
    console.error('Database Error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
});

// Export router agar bisa didaftarkan di index.js
module.exports = router;