const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db");
const { verifyToken, JWT_SECRET } = require("../middleware/auth");

const router = express.Router();

// ==========================================
// 1. USER SIGNUP
// ==========================================
router.post("/signup", async (req, res) => {
  try {
    const { full_name, email, password, phone } = req.body;

    if (!full_name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: "Please fill in all required fields."
      });
    }

    if (full_name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Name must contain at least 2 characters."
      });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address."
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 8 characters."
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if email exists
    const [existingUsers] = await pool.execute(
      "SELECT id FROM users WHERE email = ?",
      [normalizedEmail]
    );

    if (existingUsers && existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists."
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [result] = await pool.execute(
      `INSERT INTO users (full_name, email, password_hash, phone, role)
       VALUES (?, ?, ?, ?, ?)`,
      [full_name.trim(), normalizedEmail, passwordHash, phone || null, "customer"]
    );

    const user = {
      id: result.insertId,
      full_name: full_name.trim(),
      email: normalizedEmail,
      phone: phone || null,
      role: "customer"
    };

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      success: true,
      message: "Account created successfully!",
      token,
      user
    });
  } catch (error) {
    console.error("Signup error:", error.message);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists."
      });
    }
    return res.status(500).json({
      success: false,
      message: "Unable to create account. Please try again."
    });
  }
});

// ==========================================
// 2. USER LOGIN
// ==========================================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: "Please enter your email and password."
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const [users] = await pool.execute(
      `SELECT id, full_name, email, password_hash, phone, role
       FROM users
       WHERE email = ?`,
      [normalizedEmail]
    );

    if (!users || users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password."
      });
    }

    const userRecord = users[0];
    const passwordMatches = await bcrypt.compare(password, userRecord.password_hash);

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password."
      });
    }

    const user = {
      id: userRecord.id,
      full_name: userRecord.full_name,
      email: userRecord.email,
      phone: userRecord.phone || null,
      role: userRecord.role || "customer"
    };

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      message: "Login successful!",
      token,
      user
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to log in. Please try again."
    });
  }
});

// ==========================================
// 3. GET CURRENT USER PROFILE
// ==========================================
router.get("/me", verifyToken, async (req, res) => {
  try {
    const [users] = await pool.execute(
      `SELECT id, full_name, email, phone, role, created_at
       FROM users
       WHERE id = ?`,
      [req.user.id]
    );

    if (!users || users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User profile not found."
      });
    }

    const user = users[0];

    // Get user stats (total bookings and listings)
    const [userBookings] = await pool.query(
      "SELECT COUNT(*) AS total_bookings FROM bookings WHERE user_id = ?",
      [user.id]
    );

    const [userListings] = await pool.query(
      "SELECT COUNT(*) AS total_listings FROM products WHERE owner_id = ?",
      [user.id]
    );

    return res.json({
      success: true,
      user: {
        ...user,
        total_bookings: userBookings?.[0]?.total_bookings || 0,
        total_listings: userListings?.[0]?.total_listings || 0
      }
    });
  } catch (error) {
    console.error("Profile error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to load user profile."
    });
  }
});

module.exports = router;
