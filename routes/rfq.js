// routes/invoice.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const db = require("../config/db");
const generateEmailNumber = require("../utils/generateEmailNumber");
const generateRfqPdf = require("../utils/generateRfqPdf");
const generateRfqImportClearancePdf = require("../utils/generateRfqImportClearancePdf");
const generateRfqInternationalFFPdf = require("../utils/generateRfqInternationalFFPdf");
const generateRfqDomesticDeliveryPdf = require("../utils/generateRfqDomesticDeliveryPdf");
const { PDFDocument } = require('pdf-lib');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedImageTypes = ["image/jpeg", "image/jpg", "image/png"];
  
  if (file.fieldname === "goods_photo") {
    if (allowedImageTypes.includes(file.mimetype) || file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Format Goods Photo harus berupa Gambar (JPG/PNG) atau PDF!"), false);
    }
  } else {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error(`File ${file.fieldname} harus berformat PDF!`), false);
    }
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.post("/submit", upload.any(), async (req, res) => {
  try {
    const { user_id,
      service_type, 
      service_details 
    } = req.body;
    const uploadedFiles = req.files;

    console.log("BODY:", req.body);
    console.log("FILES:", req.files);

    if (!service_type) {
      return res.status(400).json({ error: "Jenis layanan (service_type) wajib diisi." });
    }

    let finalizedDetailsJSON = "{}";
    let detailsObj = {};
    if (service_details) {
      try {
        detailsObj = JSON.parse(service_details);
        finalizedDetailsJSON = service_details;
      } catch (e) {
        return res.status(400).json({ error: "Format service_details harus berupa valid JSON string." });
      }
    }

    const stringServiceType = String(service_type);
    const safeServiceType = stringServiceType.replace(/\_/g, " ");
    const rfqNumber = generateEmailNumber(stringServiceType);
    const userId = user_id ? user_id : null;

    const rfqQuery = `
      INSERT INTO rfq_requests (rfq_number, user_id, service_type, service_details, status_request) 
      VALUES (?, ?, ?, ?, 'incoming')
    `;
    
    const [rfqResult] = await db.query(rfqQuery, [rfqNumber, userId, service_type, finalizedDetailsJSON]);
    const insertedRfqId = rfqResult.insertId;
    
    const savedAttachments = [];
    const localPdfAttachments = [];

    if (uploadedFiles && uploadedFiles.length > 0) {
      const attachmentQuery = `
        INSERT INTO rfq_attachments (rfq_id, file_name, file_path, document_type) 
        VALUES (?, ?, ?, ?)
      `;

      for (const file of uploadedFiles) {
        if (!file || !file.filename) {
          continue;
        }

        const fileUrl = `${req.protocol}://${req.get("host")}/uploads/invoices/${file.filename}`;
        
        let cleanDocumentType = file.fieldname;
        if (file.fieldname.startsWith("files[")) {
          cleanDocumentType = file.fieldname.replace(/^files\[(.*)\]$/, "$1");
        }

        await db.query(attachmentQuery, [
          insertedRfqId, 
          file.originalname || "unnamed_file", 
          fileUrl, 
          cleanDocumentType
        ]);

        savedAttachments.push({
          document_type: cleanDocumentType,
          file_name: file.originalname,
          file_url: fileUrl
        });

        if (file.mimetype === "application/pdf") {
          localPdfAttachments.push(file.path);
        }
      }
    }

    const outputDir = path.join(__dirname, "../RFQBeforeFinalPDF");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const safeRfqNumber = rfqNumber.replace(/\//g, "-");

    const uniqueFileName = `RFQ-${safeRfqNumber}-${Date.now()}.pdf`;  
    const pdfPath = path.join(outputDir, uniqueFileName);

    if (stringServiceType === 'Export_Handling') {
      await generateRfqPdf({

        rfq_number: rfqNumber,

        service_type : safeServiceType,

        company_name: detailsObj.company_name,

        company_address: detailsObj.company_address,

        pic_name: detailsObj.pic_name,

        pic_email: detailsObj.pic_email,

        pic_number: detailsObj.pic_number,

        hs_code: detailsObj.hs_code,

        notes: detailsObj.notes

      }, pdfPath);
    } else if (stringServiceType === 'Import_Clearance') {
      await generateRfqImportClearancePdf({

        rfq_number: rfqNumber,

        service_type : safeServiceType,

        company_name: detailsObj.company_name,

        company_address: detailsObj.company_address,

        pic_name: detailsObj.pic_name,

        pic_email: detailsObj.pic_email,

        pic_number: detailsObj.pic_number,

        hs_code: detailsObj.hs_code,

        notes: detailsObj.notes

      }, pdfPath);
    } else if (stringServiceType === 'International_FF') {
      await generateRfqInternationalFFPdf({

        rfq_number: rfqNumber,

        service_type : safeServiceType,

        company_name: detailsObj.company_name,

        company_address: detailsObj.company_address,

        pic_name: detailsObj.pic_name,

        pic_email: detailsObj.pic_email,

        pic_number: detailsObj.pic_number,

        notes: detailsObj.notes

      }, pdfPath);
    } else if (stringServiceType === 'Domestic_Delivery') {
      await generateRfqDomesticDeliveryPdf({

        rfq_number: rfqNumber,

        service_type : safeServiceType,

        company_name: detailsObj.company_name,

        company_address: detailsObj.company_address,

        pic_name: detailsObj.pic_name,

        pic_email: detailsObj.pic_email,

        pic_number: detailsObj.pic_number,

        shipping_address: detailsObj.shipping_address,

        destination_address: detailsObj.destination_address,

        goods_gross_weight: detailsObj.goods_gross_weight,

        goods_volume: detailsObj.goods_volume,

        fleet_type: detailsObj.fleet_type,

        notes: detailsObj.notes

      }, pdfPath);
    } else if (stringServiceType === 'Undername_Export') {
      await generateRfqPdf({

        rfq_number: rfqNumber,

        service_type : safeServiceType,

        company_name: detailsObj.company_name,

        company_address: detailsObj.company_address,

        pic_name: detailsObj.pic_name,

        pic_email: detailsObj.pic_email,

        pic_number: detailsObj.pic_number,

        hs_code: detailsObj.hs_code,

        notes: detailsObj.notes

      }, pdfPath);
    } else if (stringServiceType === 'Undername_Import') {
      await generateRfqImportClearancePdf({

        rfq_number: rfqNumber,

        service_type : safeServiceType,

        company_name: detailsObj.company_name,

        company_address: detailsObj.company_address,

        pic_name: detailsObj.pic_name,

        pic_email: detailsObj.pic_email,

        pic_number: detailsObj.pic_number,

        hs_code: detailsObj.hs_code,

        notes: detailsObj.notes

      }, pdfPath);
    };

    // const finalPdfPath = path.join(outputDir, `${uniqueFileName}.pdf`);

    const pdfUrl = `${req.protocol}://${req.get("host")}/RFQBeforeFinalPDF/${uniqueFileName}.pdf`;

    const beforeFinalQuery = `
      INSERT INTO rfq_before_final (rfq_id, rfq_number, file_path) 
      VALUES (?, ?, ?)
    `;
    await db.query(beforeFinalQuery, [insertedRfqId, rfqNumber, pdfUrl]);

    const mergedOutputDir = path.join(__dirname, "../RFQFinalMergedPDF");
    if (!fs.existsSync(mergedOutputDir)) {
      fs.mkdirSync(mergedOutputDir, { recursive: true });
    }

    const mergedFileName = `RFQ-MERGED-${safeRfqNumber}-${Date.now()}.pdf`;
    const mergedPdfPath = path.join(mergedOutputDir, mergedFileName);

    if (!fs.existsSync(pdfPath)) {
      return res.status(400).json({
        success: false,
        error: `Gagal memproses permintaan. File PDF Utama tidak ditemukan di sistem. Pastikan service_type '${stringServiceType}' sudah sesuai.`
      });
    }

    // Load PDF Utama yang baru saja dibuat
    const mainPdfBuffer = fs.readFileSync(pdfPath);
    const finalPdfDoc = await PDFDocument.create();
    
    const mainPdfDoc = await PDFDocument.load(mainPdfBuffer);
    const mainPages = await finalPdfDoc.copyPages(mainPdfDoc, mainPdfDoc.getPageIndices());
    mainPages.forEach((page) => finalPdfDoc.addPage(page));

    // Iterasi & Gabungkan berkas berkas PDF lampiran
    for (const attachmentPath of localPdfAttachments) {
      if (fs.existsSync(attachmentPath)) {
        const attachmentBuffer = fs.readFileSync(attachmentPath);
        const attachmentPdfDoc = await PDFDocument.load(attachmentBuffer);
        const attachmentPages = await finalPdfDoc.copyPages(attachmentPdfDoc, attachmentPdfDoc.getPageIndices());
        attachmentPages.forEach((page) => finalPdfDoc.addPage(page));
      }
    }

    // Simpan file hasil gabungan ke folder terpisah
    const finalPdfBytes = await finalPdfDoc.save();
    fs.writeFileSync(mergedPdfPath, finalPdfBytes);

    const mergedPdfUrl = `${req.protocol}://${req.get("host")}/RFQFinalMergedPDF/${mergedFileName}`;

    // Simpan informasi file gabungan ke database agar bisa dipanggil API Frontend terpisah
    const finalMergedQuery = `
      INSERT INTO rfq_final_merged (rfq_id, rfq_number, file_path) 
      VALUES (?, ?, ?)
    `;
    await db.query(finalMergedQuery, [insertedRfqId, rfqNumber, mergedPdfUrl]);

    return res.status(201).json({
      success: true,
      message: "Permintaan RFQ berhasil dibuat, disimpan, dan PDF Utama berhasil digenerate!",
      data: {
        rfq_id: insertedRfqId,
        rfq_number: rfqNumber,
        attachments: savedAttachments,
        pdf_utama_url: pdfUrl,
        pdf_gabungan_url: mergedPdfUrl,
        user_id: user_id
      }
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/rfq/user/:user_id
 * @desc    Mengambil semua daftar riwayat RFQ milik visitor tertentu berdasarkan public_id user
 * @access  Private/Public (Sesuai session auth Anda)
 */
router.get("/user/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;

    if (!user_id) {
      return res.status(400).json({ 
        success: false, 
        error: "User Public ID (user_id) wajib disertakan!" 
      });
    }

    // Query untuk mengambil semua kolom yang dibutuhkan dari rfq_requests berdasarkan user_id visitor
    // Kita urutkan dari yang paling baru (DESC) agar muncul paling atas di dropdown visitor
    const query = `
      SELECT id, rfq_number, service_type, status_request, created_at 
      FROM rfq_requests 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `;

    const [rows] = await db.query(query, [user_id]);

    // Kembalikan data berupa objek yang membungkus array rfq_requests 
    // agar selaras dengan pemanggilan `data.rfq_requests` pada sisi frontend visitor.jsx
    return res.status(200).json({
      success: true,
      rfq_requests: rows
    });

  } catch (error) {
    console.error("Error pada getVisitorRfqList Backend:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Terjadi kesalahan pada server saat mengambil data RFQ: " + error.message 
    });
  }
});

router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "Ukuran file terlalu besar. Maksimal 5MB." });
    }
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

module.exports = router;