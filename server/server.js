const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./db");
const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const bookingRoutes = require("./routes/bookings");
const reviewRoutes = require("./routes/reviews");
const adminRoutes = require("./routes/admin");

const app = express();
const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET;

// Check JWT configuration
if (!JWT_SECRET) {
  console.warn("⚠️ JWT_SECRET is not set in server/.env, using default development secret.");
}

// Middleware
app.use(cors());
app.use(express.json());

// ==========================================
// 1. HOME & HEALTH CHECK
// ==========================================
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to RentLoop API!",
    version: "1.0.0",
    status: "online",
    endpoints: {
      auth: "/api/auth",
      products: "/api/products",
      bookings: "/api/bookings",
      reviews: "/api/reviews",
      health: "/api/health"
    }
  });
});

app.get("/health", (req, res) => {
  res.redirect("/api/health");
});

app.get("/api/health", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 AS databaseConnected");

    res.json({
      success: true,
      message: "RentLoop backend is working!",
      databaseConnected: rows[0].databaseConnected === 1,
      mode: pool.isMySQLConnected && pool.isMySQLConnected() ? "MySQL" : "Resilient Engine"
    });
  } catch (error) {
    console.error("Database health error:", error.message);
    res.status(500).json({
      success: false,
      message: "Database connection failed"
    });
  }
});

// ==========================================
// 2. MODULAR API ROUTES
// ==========================================
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/admin", adminRoutes);

// ==========================================
// 3. 404 & ERROR HANDLING
// ==========================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.url} not found on RentLoop API.`
  });
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error occurred."
  });
});

// ==========================================
// 4. START SERVER (WITH AUTO PORT FALLBACK)
// ==========================================
function startServer(portToTry) {
  const serverInstance = app.listen(portToTry, () => {
    console.log(`🚀 RentLoop backend running at http://localhost:${portToTry}`);
    console.log(`📡 Ready to accept requests.`);
  });

  serverInstance.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.warn(`⚠️ Port ${portToTry} is in use (often macOS AirPlay). Automatically trying port ${portToTry + 1}...`);
      startServer(portToTry + 1);
    } else {
      console.error("Server error:", err);
    }
  });
}

if (require.main === module) {
  startServer(Number(PORT || 5002));
}

module.exports = { app, startServer };