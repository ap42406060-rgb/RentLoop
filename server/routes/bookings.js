const express = require("express");
const pool = require("../db");
const { optionalAuth, verifyToken } = require("../middleware/auth");

const router = express.Router();

// ==========================================
// 1. CREATE A BOOKING
// ==========================================
router.post("/", optionalAuth, async (req, res) => {
  try {
    const {
      product_id,
      customer_name,
      customer_email,
      customer_phone,
      start_date,
      end_date
    } = req.body;

    if (!product_id || !customer_name?.trim() || !customer_email?.trim() || !start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required booking details."
      });
    }

    // Validate email format
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(customer_email.trim())) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address."
      });
    }

    // Fetch product
    const [products] = await pool.query(
      "SELECT * FROM products WHERE id = ?",
      [Number(product_id)]
    );

    if (!products || products.length === 0) {
      return res.status(404).json({
        success: false,
        message: "The requested rental item was not found."
      });
    }

    const product = products[0];

    // Calculate rental days
    const start = new Date(`${start_date}T00:00:00Z`);
    const end = new Date(`${end_date}T00:00:00Z`);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    const totalDays = diffDays >= 0 ? diffDays + 1 : 0;

    if (totalDays <= 0) {
      return res.status(400).json({
        success: false,
        message: "End date must be on or after start date."
      });
    }

    // Check for date collisions with existing confirmed bookings
    const [conflicts] = await pool.query(
      `SELECT id, start_date, end_date FROM bookings
       WHERE product_id = ? AND status = 'confirmed'
       AND (start_date <= ? AND end_date >= ?)`,
      [Number(product_id), end_date, start_date]
    );

    if (conflicts && conflicts.length > 0) {
      const conflict = conflicts[0];
      return res.status(409).json({
        success: false,
        message: `This item is already reserved from ${conflict.start_date} to ${conflict.end_date}. Please select different rental dates.`
      });
    }

    const totalPrice = Number(product.price) * totalDays;
    const userId = req.user ? req.user.id : null;

    const [result] = await pool.execute(
      `INSERT INTO bookings (product_id, user_id, customer_name, customer_email, customer_phone, start_date, end_date, total_days, total_price, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        Number(product_id),
        userId,
        customer_name.trim(),
        customer_email.trim().toLowerCase(),
        customer_phone?.trim() || null,
        start_date,
        end_date,
        totalDays,
        totalPrice,
        "confirmed"
      ]
    );

    const booking = {
      id: result.insertId,
      product_id: Number(product_id),
      product_name: product.name,
      product_image: product.image,
      user_id: userId,
      customer_name: customer_name.trim(),
      customer_email: customer_email.trim().toLowerCase(),
      customer_phone: customer_phone?.trim() || null,
      start_date,
      end_date,
      total_days: totalDays,
      total_price: totalPrice,
      status: "confirmed",
      created_at: new Date().toISOString()
    };

    return res.status(201).json({
      success: true,
      message: "Booking confirmed successfully!",
      booking
    });
  } catch (error) {
    console.error("Create booking error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to confirm booking. Please try again."
    });
  }
});

// ==========================================
// 2. GET CURRENT USER'S BOOKINGS
// ==========================================
router.get("/my-bookings", optionalAuth, async (req, res) => {
  try {
    const userEmail = req.query.email || req.user?.email;
    const userId = req.user?.id;

    if (!userId && !userEmail) {
      return res.status(400).json({
        success: false,
        message: "Please log in to view your bookings."
      });
    }

    // Query bookings joined with product info
    let bookings = [];

    if (userId) {
      const [rows] = await pool.query(
        `SELECT b.*, p.name AS product_name, p.image AS product_image, p.location AS product_location, p.price AS product_price, p.category
         FROM bookings b
         JOIN products p ON b.product_id = p.id
         WHERE b.user_id = ?
         ORDER BY b.id DESC`,
        [userId]
      );
      bookings = rows;
    }

    if ((!bookings || bookings.length === 0) && userEmail) {
      const [rows] = await pool.query(
        `SELECT b.*, p.name AS product_name, p.image AS product_image, p.location AS product_location, p.price AS product_price, p.category
         FROM bookings b
         JOIN products p ON b.product_id = p.id
         WHERE b.customer_email = ?
         ORDER BY b.id DESC`,
        [userEmail.toLowerCase()]
      );
      bookings = rows;
    }

    return res.json({
      success: true,
      count: bookings.length,
      bookings: bookings || []
    });
  } catch (error) {
    console.error("Fetch user bookings error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to load bookings."
    });
  }
});

// ==========================================
// 3. CANCEL A BOOKING
// ==========================================
router.patch("/:id/cancel", optionalAuth, async (req, res) => {
  try {
    const bookingId = Number(req.params.id);

    await pool.execute(
      "UPDATE bookings SET status = 'cancelled' WHERE id = ?",
      [bookingId]
    );

    return res.json({
      success: true,
      message: "Booking has been cancelled."
    });
  } catch (error) {
    console.error("Cancel booking error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to cancel booking."
    });
  }
});

// ==========================================
// 4. GET RESERVED DATES FOR A PRODUCT
// ==========================================
router.get("/product/:productId/reserved-dates", async (req, res) => {
  try {
    const productId = Number(req.params.productId);
    const [rows] = await pool.query(
      "SELECT start_date, end_date FROM bookings WHERE product_id = ? AND status = 'confirmed'",
      [productId]
    );

    return res.json({
      success: true,
      reservedDates: rows || []
    });
  } catch (error) {
    console.error("Fetch reserved dates error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to load reserved dates."
    });
  }
});

module.exports = router;
