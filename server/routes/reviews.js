const express = require("express");
const pool = require("../db");
const { optionalAuth } = require("../middleware/auth");

const router = express.Router();

// ==========================================
// 1. GET REVIEWS FOR A PRODUCT
// ==========================================
router.get("/:productId", async (req, res) => {
  try {
    const productId = Number(req.params.productId);

    const [reviews] = await pool.query(
      "SELECT * FROM reviews WHERE product_id = ? ORDER BY id DESC",
      [productId]
    );

    return res.json({
      success: true,
      count: reviews ? reviews.length : 0,
      reviews: reviews || []
    });
  } catch (error) {
    console.error("Get reviews error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to load reviews."
    });
  }
});

// ==========================================
// 2. ADD A REVIEW
// ==========================================
router.post("/:productId", optionalAuth, async (req, res) => {
  try {
    const productId = Number(req.params.productId);
    const { reviewer_name, rating, comment } = req.body;

    if (!reviewer_name?.trim() || !rating) {
      return res.status(400).json({
        success: false,
        message: "Please provide your name and a rating."
      });
    }

    const numRating = Number(rating);
    if (numRating < 1 || numRating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5 stars."
      });
    }

    const userId = req.user ? req.user.id : null;

    const [result] = await pool.execute(
      `INSERT INTO reviews (product_id, user_id, reviewer_name, rating, comment)
       VALUES (?, ?, ?, ?, ?)`,
      [
        productId,
        userId,
        reviewer_name.trim(),
        numRating,
        comment?.trim() || ""
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Thank you! Your review has been added.",
      reviewId: result.insertId
    });
  } catch (error) {
    console.error("Add review error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to add review. Please try again."
    });
  }
});

module.exports = router;
