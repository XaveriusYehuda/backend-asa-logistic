const express = require("express");
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const generateId = require("../utils/generateId");
const { verifyToken } = require('../middleware/jwt');

const router = express.Router();

// =====================
// SIGN UP
// =====================
router.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const userId = generateId();

    if (!username || !email || !password) {
      return res.status(400).json({
        message: "Semua field wajib diisi",
      });
    }

    const [existingUser] = await db.execute(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(409).json({
        message: "Email sudah digunakan",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

     await db.execute(
      `
      INSERT INTO users
      (public_id, username, email, password)
      VALUES (?, ?, ?, ?)
      `,
      [userId, username, email, hashedPassword]
    );

    res.status(201).json({
      message: "Registrasi berhasil",
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
});


// =====================
// LOGIN
// =====================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
    return res.status(400).json({ message: 'Email dan password wajib diisi' });
  }

    const [users] = await db.execute(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        message: "Email atau password salah",
      });
    }

    const user = users[0];

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    let role = 'visitor';
    if (email.toLowerCase() === 'officerasa2026@gmail.com') {
      role = 'officer';
    }

    if (!isMatch) {
      return res.status(401).json({
        message: "Email atau password salah",
      });
    }

    const token = jwt.sign(
      {
        public_id: user.public_id,
        email: user.email,
        username: user.username,
        role: role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "15m",
      }
    );

    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({
      message: "Login berhasil",
      user: {
        id: user.id,
        pubId: user.public_id,
        username: user.username,
        email: user.email,
        role: role
      },
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
});

router.get(
  "/profile",
  verifyToken,
  async (req, res) => {
    res.json({
      user: req.user,
    });
  }
);

router.post("/logout", (req, res) => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/"
  });

  res.json({
    message: "Logout berhasil",
  });
});

module.exports = router;