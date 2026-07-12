const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

function generateRfqPdf(data, outputPath) {

    return new Promise((resolve, reject) => {

        const doc = new PDFDocument({
            size: "A4",
            margin: 50
        });

        doc.registerFont(
          "Times",
          path.join(__dirname, "../fonts/times.ttf")
        );

        doc.registerFont(
          "Times-Bold",
          path.join(__dirname, "../fonts/timesbd.ttf")
        );

        doc.registerFont(
          "Times-Italic",
          path.join(__dirname, "../fonts/timesi.ttf")
        );

        doc.registerFont(
          "Times-BoldItalic",
          path.join(__dirname, "../fonts/timesbi.ttf")
        );

        const stream = fs.createWriteStream(outputPath);

        doc.pipe(stream);

        // isi PDF nanti di sini
        // header

        // Gambar akan otomatis mengecil agar muat di dalam kotak 100x100 poin
        // doc.image('./utils/logo-asa-black.png', 90, 55, { fit: [103, 60], align: 'center', valign: 'center' });

        doc
        .font("Times-Bold")
        .fontSize(16)
        .text("DATA PERMINTAAN SURAT PENAWARAN HARGA", 50 , doc.y, {
            align: "center"
        });
        // doc
        // .font("Times-Bold")
        // .fontSize(16)
        // .text("PT ARDANA SEJAHTERA ABADI",  200, doc.y, { ===> 200 adalah angka posisi sumbu x
        //     align: "center"
        // });

        // doc
        // .font("Times-Bold")
        // .fontSize(11)
        // .text("EMKL - INTERNATIONAL FREIGHT FORWARDER", 50, doc.y, {
        //     align: "center"
        // });

        // doc
        // .font("Times")
        // .fontSize(10)
        // .text("Semarang Indah Blok E2 No.65", 50, doc.y, {
        //     align: "center"
        // });

        // doc
        // .font("Times")
        // .fontSize(10)
        // .text("Semarang Barat, Kota Semarang", 50, doc.y, {
        //     align: "center"
        // });

        // doc
        // .font("Times")
        // .fontSize(10)
        // .text("Telp.(024) 76438979 Email: asalogistic.office@gmail.com", 50, doc.y, {
        //     align: "center"
        // });

        doc.moveDown();

        doc
        .moveTo(50, doc.y)
        .lineTo(545, doc.y)
        .lineWidth(1)
        .stroke();

        doc.moveDown();

        doc
        .fontSize(11)

        const tanggal = new Intl.DateTimeFormat("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(new Date());

        doc
        .font("Times")
        .text(tanggal, {
          align: "right"
        });

        doc.moveDown();

        doc.text("Perihal", 50, 150);
        doc.text(":", 120, 150);
        doc.text(`Permohonan Surat Penawaran Jasa ${data.service_type}`, 130, 150);

        doc.text("Nomor", 50, 165);
        doc.text(":", 120, 165);
        doc.text(data.rfq_number, 130, 165);

        doc.moveDown();

        doc.text("Kepada Yth.", 50, doc.y, {
          align: "justify",
          lineGap: 5
        });

        doc.text("Pimpinan PT Ardana Sejahtera Abadi");

        doc.moveDown();

        doc.text("Dengan hormat,", 50, doc.y, {
          align: "justify",
          lineGap: 5
        });

        doc.moveDown();

        function field(doc, label, value) {

          const startY = doc.y;

          doc.text(label, 50, startY, {
            width: 140,
            lineGap: 3
          });

          doc.text(":", 195, startY, {
            lineGap: 3
          });

          doc.text(value || "-", 210, startY, {
            lineGap: 3
          });

        }

        field(doc,"Nama Perusahaan",data.company_name);

        field(doc,"Alamat Perusahaan",data.company_address);

        field(doc,"PIC",data.pic_name);

        field(doc,"Email",data.pic_email);

        field(doc,"Telp",data.pic_number);

        doc.moveDown();

        doc.text(
          `Sehubungan dengan kebutuhan jasa ${data.service_type} di perusahaan kami, kami mengajukan permintaan penawaran harga kepada PT Ardana Sejahtera Abadi. Kami mohon Bapak/Ibu dapat menyampaikan penawaran yang memuat informasi berikut.`,
          50, 
          doc.y, 
          {
            align: "justify",
            lineGap: 5
          }
        );

        doc.moveDown();

        field(doc,"Kode HS",data.hs_code);

        field(doc,"Invoice","Terlampir");

        field(doc,"Packing List","Terlampir");

        field(doc,"Notes",data.notes);

        doc.moveDown();

        doc.text(
          `Demikian surat ini kami sampaikan. Atas perhatian dan kerja sama Bapak/Ibu kami ucapkan terima kasih.`,
          50, 
          doc.y, 
          {
            align: "justify",
            lineGap: 5
          }
        );

        doc.moveDown(3);

        doc.text(`Semarang, ${tanggal}`,{
            align:"right"
        });

        doc.moveDown();

        doc.text("Hormat kami,",{
            align:"right"
        });

        doc.moveDown(4);

        doc.text(data.pic_name,{
            align:"right"
        });

        doc.text(data.company_name,{
            align:"right"
        });

        doc.end();

        stream.on("finish", resolve);
        stream.on("error", reject);

    });

}

module.exports = generateRfqPdf;