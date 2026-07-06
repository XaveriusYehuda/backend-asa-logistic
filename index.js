const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const authRoutes = require("./routes/auth");
const rfqRoutes = require("./routes/rfq");
const worksheetRouter = require('./routes/worksheet');
const dashboardRouter = require('./routes/dashboard');
const finalRouter = require('./routes/final');
const rfqFinalMergedRouter = require("./routes/rfqFinalMerged");

const app = express();

// app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use(
  // cors({
  //   // origin: "http://localhost:5173",
  //   origin: 'https://asalogistic.co.id',
  //   credentials: true,
  // })
  cors()
);

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); // Mengizinkan semua origin
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/finalRFQ", express.static(path.join(__dirname, "finalRFQ")));
app.use("/RFQBeforeFinalPDF", express.static(path.join(__dirname, "RFQBeforeFinalPDF")));
app.use("/RFQFinalMergedPDF", express.static(path.join(__dirname, "RFQFinalMergedPDF")));

app.use("/api/auth", authRoutes);

app.use("/api/rfq", rfqRoutes);

app.use('/api/worksheet', worksheetRouter);

app.use('/api/dashboard', dashboardRouter);

app.use('/api/final', finalRouter);

app.use("/api/rfq-final", rfqFinalMergedRouter);

app.get("/", (req, res) => {
  res.send("API Running");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});