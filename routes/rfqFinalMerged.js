// routes/rfqFinalMerged.js
const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const db = require("../config/db");

/**
 * @route   GET /api/rfq-final/view/:rfq_number
 * @desc    Melihat file PDF hasil merge langsung di browser (Detail Quote Request)
 * @access  Public/Private
 */
router.get("/view/:rfq_number", async (req, res) => {
  try {
    const { rfq_number } = req.params;

    // Ambil data file path dari tabel rfq_final_merged berdasarkan rfq_number
    const query = "SELECT file_path FROM rfq_final_merged WHERE rfq_number = ? LIMIT 1";
    const [rows] = await db.query(query, [rfq_number]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: "File PDF gabungan tidak ditemukan untuk RFQ ini." });
    }

    // Ekstrak nama file dari URL yang disimpan di database
    const fileUrl = rows[0].file_path;
    const fileName = path.basename(fileUrl);
    
    // Tentukan path absolut file lokal di server
    const localFilePath = path.join(__dirname, "../RFQFinalMergedPDF", fileName);

    // Cek ketersediaan file fisik di server
    if (!fs.existsSync(localFilePath)) {
      return res.status(404).json({ success: false, error: "File fisik PDF tidak ditemukan di server." });
    }

    // Set header agar browser membuka file secara INLINE (menampilkan/melihat detail)
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
    res.setHeader("Content-Security-Policy", "default-src 'none'; connect-src 'self' http://localhost:3000;");

    // Kirim file ke client
    return res.sendFile(localFilePath);

  } catch (error) {
    console.error("Error pada view PDF:", error);
    return res.status(500).json({ success: false, error: "Terjadi kesalahan server: " + error.message });
  }
});

/**
 * @route   GET /api/rfq-final/download/:rfq_number
 * @desc    Mengunduh file PDF hasil merge (Download Quote Request)
 * @access  Public/Private
 */
router.get("/download/:rfq_number", async (req, res) => {
  try {
    const { rfq_number } = req.params;

    // Ambil data file path dari tabel rfq_final_merged berdasarkan rfq_number
    const query = "SELECT file_path FROM rfq_final_merged WHERE rfq_number = ? LIMIT 1";
    const [rows] = await db.query(query, [rfq_number]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: "File PDF gabungan tidak ditemukan untuk RFQ ini." });
    }

    // Ekstrak nama file dari URL
    const fileUrl = rows[0].file_path;
    const fileName = path.basename(fileUrl);
    
    // Tentukan path absolut file lokal di server
    const localFilePath = path.join(__dirname, "../RFQFinalMergedPDF", fileName);

    // Cek ketersediaan file fisik di server
    if (!fs.existsSync(localFilePath)) {
      return res.status(404).json({ success: false, error: "File fisik PDF tidak ditemukan di server." });
    }

    // Menggunakan fungsi bawaan Express res.download untuk otomatis memicu download (ATTACHMENT)
    return res.download(localFilePath, fileName, (err) => {
      if (err) {
        console.error("Gagal mendownload file:", err);
      }
    });

  } catch (error) {
    console.error("Error pada download PDF:", error);
    return res.status(500).json({ success: false, error: "Terjadi kesalahan server: " + error.message });
  }
});

module.exports = router;