const { PDFDocument } = require('pdf-lib');
const fs = require('fs');

async function mergeFormWithAttachment(mainPdfUrl, attachmentUrl) {
  // 1. Ambil PDF Utama (Hasil render form Anda sebelumnya)
  const mainPdfBuffer = fs.readFileSync(mainPdfUrl);
  
  // 2. Ambil PDF Lampiran (Bisa dari input file form atau file statis di server)
  const attachmentPdfBuffer = fs.readFileSync(attachmentUrl);

  // 3. Load kedua dokumen ke pdf-lib
  const mainPdfDoc = await PDFDocument.load(mainPdfBuffer);
  const attachmentPdfDoc = await PDFDocument.load(attachmentPdfBuffer);

  // 4. Buat dokumen PDF baru sebagai kontainer final
  const finalPdfDoc = await PDFDocument.create();

  // 5. Salin halaman dari PDF Utama ke PDF Final
  const mainPages = await finalPdfDoc.copyPages(mainPdfDoc, mainPdfDoc.getPageIndices());
  mainPages.forEach((page) => finalPdfDoc.addPage(page));

  // 6. Salin halaman dari PDF Lampiran ke PDF Final
  const attachmentPages = await finalPdfDoc.copyPages(attachmentPdfDoc, attachmentPdfDoc.getPageIndices());
  attachmentPages.forEach((page) => finalPdfDoc.addPage(page));

  // 7. Simpan sebagai file PDF Final
  const finalPdfBytes = await finalPdfDoc.save();
  fs.writeFileSync('dokumen_final_lengkap.pdf', finalPdfBytes);
  
  console.log("PDF berhasil digabungkan!");
}

mergeFormWithAttachment();