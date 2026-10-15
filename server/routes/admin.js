const express = require("express");
const pool = require("../db");
const { verifyToken, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// Apply auth & admin verification to all admin routes
router.use(verifyToken, requireAdmin);

// ==========================================
// 1. GET PLATFORM OVERVIEW & ITEM ORDER STATS
// ==========================================
router.get("/stats", async (req, res) => {
  try {
    // 1. Fetch all bookings
    const [bookings] = await pool.query("SELECT * FROM bookings ORDER BY id DESC");
    const allBookings = Array.isArray(bookings) ? bookings : [];

    // 2. Fetch all products
    const [products] = await pool.query("SELECT * FROM products ORDER BY id DESC");
    const allProducts = Array.isArray(products) ? products : [];

    // 3. Fetch all users
    const [users] = await pool.query("SELECT id, full_name, email, role, created_at FROM users");
    const allUsers = Array.isArray(users) ? users : [];

    // Platform Metrics
    const totalUsers = allUsers.length;
    const totalProducts = allProducts.length;
    const totalBookings = allBookings.length;
    const totalRevenue = allBookings.reduce(
      (sum, b) => sum + (Number(b.total_price) || 0),
      0
    );

    // Compute how many people ordered each item
    const itemStatsMap = {};
    for (const b of allBookings) {
      const pid = b.product_id;
      if (!itemStatsMap[pid]) {
        itemStatsMap[pid] = {
          ordersCount: 0,
          totalEarnings: 0,
          customerNames: [],
          lastOrderDate: b.created_at || b.start_date
        };
      }
      itemStatsMap[pid].ordersCount += 1;
      itemStatsMap[pid].totalEarnings += Number(b.total_price) || 0;
      if (b.customer_name && !itemStatsMap[pid].customerNames.includes(b.customer_name)) {
        itemStatsMap[pid].customerNames.push(b.customer_name);
      }
    }

    const itemsOrderedStats = allProducts.map((p) => {
      const stats = itemStatsMap[p.id] || {
        ordersCount: 0,
        totalEarnings: 0,
        customerNames: [],
        lastOrderDate: null
      };

      return {
        id: p.id,
        name: p.name,
        category: p.category,
        image: p.image,
        daily_price: p.price,
        location: p.location,
        available: p.available === 1 || p.available === true,
        ordersCount: stats.ordersCount, // HOW MANY PEOPLE ORDERED THIS ITEM
        totalEarnings: stats.totalEarnings,
        uniqueCustomersCount: stats.customerNames.length,
        customerNames: stats.customerNames,
        lastOrderDate: stats.lastOrderDate
      };
    });

    // Sort by most ordered items first
    itemsOrderedStats.sort((a, b) => b.ordersCount - a.ordersCount || b.totalEarnings - a.totalEarnings);

    return res.json({
      success: true,
      stats: {
        totalUsers,
        totalProducts,
        totalBookings,
        totalRevenue,
        itemsOrderedStats
      }
    });
  } catch (error) {
    console.error("Admin stats error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to load admin platform statistics."
    });
  }
});

// ==========================================
// 2. GET ALL ORDERS / BOOKINGS FOR ADMIN
// ==========================================
router.get("/bookings", async (req, res) => {
  try {
    const [bookings] = await pool.query(
      `SELECT b.*, p.name AS product_name, p.image AS product_image, p.category, p.location AS product_location
       FROM bookings b
       LEFT JOIN products p ON b.product_id = p.id
       ORDER BY b.id DESC`
    );

    return res.json({
      success: true,
      count: bookings ? bookings.length : 0,
      bookings: bookings || []
    });
  } catch (error) {
    console.error("Admin bookings error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to load customer bookings."
    });
  }
});

// ==========================================
// 3. UPDATE ORDER STATUS (ADMIN ACTION)
// ==========================================
router.patch("/bookings/:id/status", async (req, res) => {
  try {
    const bookingId = Number(req.params.id);
    const { status } = req.body;

    const validStatuses = ["confirmed", "pending", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking status. Choose: confirmed, pending, completed, cancelled."
      });
    }

    await pool.execute(
      "UPDATE bookings SET status = ? WHERE id = ?",
      [status, bookingId]
    );

    return res.json({
      success: true,
      message: `Booking #${bookingId} status updated to ${status}.`
    });
  } catch (error) {
    console.error("Update booking status error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update booking status."
    });
  }
});

// ==========================================
// 4. GET ALL REGISTERED USERS
// ==========================================
router.get("/users", async (req, res) => {
  try {
    const [users] = await pool.query(
      "SELECT id, full_name, email, phone, role, created_at FROM users ORDER BY id DESC"
    );

    return res.json({
      success: true,
      count: users ? users.length : 0,
      users: users || []
    });
  } catch (error) {
    console.error("Admin users error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to load user list."
    });
  }
});

module.exports = router;
