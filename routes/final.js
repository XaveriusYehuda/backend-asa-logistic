const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const db = require("../config/db"); // Menyesuaikan dengan konfigurasi database Anda

// Pastikan folder 'finalRFQ' ada, jika tidak, buat baru
const dir = "./finalRFQ";
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// Konfigurasi Storage Multer khusus untuk Final RFQ
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "finalRFQ/"); // Disimpan ke folder finalRFQ
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    // Format nama file: final-rfq-[timestamp].[ekstensi]
    cb(null, "final-rfq-" + uniqueSuffix + path.extname(file.originalname));
  }
});

// Filter File (Hanya mengizinkan PDF untuk dokumen final)
const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("File Final RFQ harus berformat PDF!"), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // Batasan ukuran file (misal: 10MB)
});

router.post("/submit", upload.single("final_document"), async (req, res) => {
  try {
    const { rfq_number } = req.body; // Mengambil identifier unik rfq dari worksheet

    if (!rfq_number) {
      return res.status(400).json({ error: "Nomor RFQ (Mail Number) tidak ditemukan!" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "File dokumen final wajib diunggah!" });
    }

    // 1. Cari internal ID dari rfq_requests berdasarkan rfq_number
    const [rfqRows] = await db.query("SELECT id FROM rfq_requests WHERE rfq_number = ?", [rfq_number]);
    
    if (rfqRows.length === 0) {
      return res.status(404).json({ error: "Data permintaan RFQ tidak valid atau tidak ditemukan." });
    }

    const rfqId = rfqRows[0].id;
    const fileUrl = `finalRFQ/${req.file.filename}`;

    // 2. Simpan atau Update (jika officer mengunggah ulang revisi file) ke rfq_final_quotations
    const insertQuery = `
      INSERT INTO rfq_final_quotations (rfq_id, file_name, file_path)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE file_name = VALUES(file_name), file_path = VALUES(file_path)
    `;
    await db.query(insertQuery, [rfqId, req.file.originalname, fileUrl]);

    // 3. Ubah status rfq_requests menjadi 'completed'
    await db.query("UPDATE rfq_requests SET status_request = 'completed' WHERE id = ?", [rfqId]);

    return res.status(200).json({
      success: true,
      message: "Dokumen final quotasi berhasil disimpan dan status RFQ diperbarui menjadi Completed!",
      data: {
        rfq_number: rfq_number,
        file_name: req.file.originalname,
        file_path: fileUrl
      }
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Error handling middleware khusus Multer
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `Multer Error: ${err.message}` });
  } else if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

router.get("/download/:rfq_number", async (req, res) => {
  try {
    const { rfq_number } = req.params;

    const query = `
      SELECT f.file_path, f.file_name 
      FROM rfq_final_quotations f
      JOIN rfq_requests r ON f.rfq_id = r.id
      WHERE r.rfq_number = ?
    `;
    const [rows] = await db.query(query, [rfq_number]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Officer belum selesai membuat berkas kalkulasi final untuk RFQ ini." });
    }

    const fileData = rows[0];
    const absolutePath = path.resolve(fileData.file_path);

    return res.download(absolutePath, fileData.file_name);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;