const mysql = require("mysql2/promise");
require("dotenv").config();
const {
  products: seedProducts,
  reviews: seedReviews,
  adminUser,
  bookings: seedBookings
} = require("./database/seedData");

let isMySQLConnected = false;
let realPool = null;

// In-memory fallback database for when MySQL server is offline or unreachable
const memoryStore = {
  users: [
    adminUser || {
      id: 1,
      full_name: "RentLoop Admin",
      email: "admin@rentloop.com",
      password_hash: "$2b$10$hZjlrZ0hGadjCahyrUBvruVK4B42oLU.f9W5DTRqyT7YEtpXrqWnO",
      phone: "9876543210",
      role: "admin",
      created_at: new Date().toISOString()
    }
  ],
  products: JSON.parse(JSON.stringify(seedProducts)),
  bookings: JSON.parse(JSON.stringify(seedBookings || [])),
  reviews: JSON.parse(JSON.stringify(seedReviews)),
  nextUserId: 10,
  nextProductId: seedProducts.length + 1,
  nextBookingId: 108,
  nextReviewId: seedReviews.length + 1
};

// Create real pool
try {
  realPool = mysql.createPool({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "rentloop",
    waitForConnections: true,
    connectionLimit: 10,
    connectTimeout: 3000
  });
} catch (err) {
  console.warn("Could not create MySQL pool:", err.message);
}

// Initialize MySQL tables and starter data if MySQL is active
async function initializeMySQL() {
  if (!realPool) return;
  try {
    const connection = await realPool.getConnection();
    isMySQLConnected = true;
    console.log(" Connected to MySQL database successfully.");

    // Create tables
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        full_name VARCHAR(100) NOT NULL,
        email VARCHAR(191) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        phone VARCHAR(20) DEFAULT NULL,
        role VARCHAR(20) DEFAULT 'customer',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        owner_id INT DEFAULT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        security_deposit DECIMAL(10,2) DEFAULT 0.00,
        location VARCHAR(255) NOT NULL,
        image VARCHAR(1000) NOT NULL,
        available BOOLEAN DEFAULT TRUE,
        rating DECIMAL(3,2) DEFAULT 4.8,
        reviews_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        user_id INT DEFAULT NULL,
        customer_name VARCHAR(100) NOT NULL,
        customer_email VARCHAR(191) NOT NULL,
        customer_phone VARCHAR(20) DEFAULT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        total_days INT NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'confirmed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        user_id INT DEFAULT NULL,
        reviewer_name VARCHAR(100) NOT NULL,
        rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Check if products exist; seed if empty
    const [rows] = await connection.query("SELECT COUNT(*) AS count FROM products");
    if (rows[0].count === 0) {
      console.log("🌱 Seeding initial products into MySQL...");
      for (const p of seedProducts) {
        await connection.query(
          `INSERT INTO products (id, name, description, category, price, security_deposit, location, image, available, rating, reviews_count)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [p.id, p.name, p.description, p.category, p.price, p.security_deposit || 0, p.location, p.image, p.available ? 1 : 0, p.rating || 4.8, p.reviews_count || 0]
        );
      }
      for (const r of seedReviews) {
        await connection.query(
          `INSERT INTO reviews (id, product_id, reviewer_name, rating, comment)
           VALUES (?, ?, ?, ?, ?)`,
          [r.id, r.product_id, r.reviewer_name, r.rating, r.comment]
        );
      }
      console.log(" Seeded initial products and reviews into MySQL.");
    }

    connection.release();
  } catch (err) {
    isMySQLConnected = false;
    console.warn(` Notice: MySQL connection not available (${err.message}). Using resilient local in-memory/JSON storage engine.`);
  }
}

// Run initialization in background
initializeMySQL();

// Universal Query Executor: Routes to MySQL if live, or memoryStore if MySQL is down
async function executeQuery(sql, params = []) {
  if (isMySQLConnected && realPool) {
    try {
      return await realPool.query(sql, params);
    } catch (err) {
      console.error("MySQL query failed, falling back to memory engine:", err.message);
    }
  }

  // --- MEMORY ENGINE IMPLEMENTATION ---
  const normalizedSql = sql.trim();
  const lowerSql = normalizedSql.toLowerCase();

  // Health check
  if (lowerSql.includes("select 1 as databaseconnected")) {
    return [[{ databaseConnected: 1 }], []];
  }

  // Count products
  if (lowerSql.startsWith("select count(*)")) {
    return [[{ count: memoryStore.products.length }], []];
  }

  // Users: Select by email
  if (lowerSql.includes("from users") && lowerSql.includes("where email =")) {
    const email = params[0]?.toLowerCase();
    const user = memoryStore.users.find((u) => u.email.toLowerCase() === email);
    return [user ? [user] : [], []];
  }

  // Users: Select by id
  if (lowerSql.includes("from users") && lowerSql.includes("where id =")) {
    const id = Number(params[0]);
    const user = memoryStore.users.find((u) => u.id === id);
    return [user ? [user] : [], []];
  }

  // Users: Insert
  if (lowerSql.startsWith("insert into users")) {
    const [full_name, email, password_hash, phone = null, role = "customer"] = params;
    const newUser = {
      id: memoryStore.nextUserId++,
      full_name,
      email: email.toLowerCase(),
      password_hash,
      phone,
      role,
      created_at: new Date().toISOString()
    };
    memoryStore.users.push(newUser);
    return [{ insertId: newUser.id, affectedRows: 1 }, []];
  }

  // Products: Select all with filters
  if (lowerSql.startsWith("select") && lowerSql.includes("from products") && !lowerSql.includes("where p.id =") && !lowerSql.includes("where id =") && !lowerSql.includes("where owner_id =")) {
    let list = [...memoryStore.products];
    return [list, []];
  }

  // Products: Select by id
  if (lowerSql.startsWith("select") && lowerSql.includes("from products") && (lowerSql.includes("where id =") || lowerSql.includes("where p.id ="))) {
    const id = Number(params[0]);
    const product = memoryStore.products.find((p) => p.id === id);
    return [product ? [product] : [], []];
  }

  // Products: Select by owner_id
  if (lowerSql.includes("from products") && lowerSql.includes("where owner_id =")) {
    const ownerId = Number(params[0]);
    const myProducts = memoryStore.products.filter((p) => p.owner_id === ownerId);
    return [myProducts, []];
  }

  // Products: Insert
  if (lowerSql.startsWith("insert into products")) {
    const [name, description, category, price, security_deposit, location, image, owner_id] = params;
    const newProduct = {
      id: memoryStore.nextProductId++,
      name,
      description,
      category,
      price: Number(price),
      security_deposit: Number(security_deposit || 0),
      location,
      image,
      owner_id: owner_id ? Number(owner_id) : null,
      available: true,
      rating: 5.0,
      reviews_count: 0,
      created_at: new Date().toISOString()
    };
    memoryStore.products.unshift(newProduct);
    return [{ insertId: newProduct.id, affectedRows: 1 }, []];
  }

  // Products: Update
  if (lowerSql.startsWith("update products")) {
    if (lowerSql.includes("set available =")) {
      const available = params[0] === 1 || params[0] === true;
      const id = Number(params[1]);
      const prod = memoryStore.products.find((p) => p.id === id);
      if (prod) prod.available = available;
      return [{ affectedRows: prod ? 1 : 0 }, []];
    }
    const [name, description, category, price, location, id] = params;
    const prod = memoryStore.products.find((p) => p.id === Number(id));
    if (prod) {
      if (name) prod.name = name;
      if (description) prod.description = description;
      if (category) prod.category = category;
      if (price) prod.price = Number(price);
      if (location) prod.location = location;
    }
    return [{ affectedRows: prod ? 1 : 0 }, []];
  }

  // Products: Delete
  if (lowerSql.startsWith("delete from products")) {
    const id = Number(params[0]);
    const initialLen = memoryStore.products.length;
    memoryStore.products = memoryStore.products.filter((p) => p.id !== id);
    return [{ affectedRows: initialLen - memoryStore.products.length }, []];
  }

  // Bookings: Insert
  if (lowerSql.startsWith("insert into bookings")) {
    const [product_id, user_id, customer_name, customer_email, customer_phone, start_date, end_date, total_days, total_price, status = "confirmed"] = params;
    const newBooking = {
      id: memoryStore.nextBookingId++,
      product_id: Number(product_id),
      user_id: user_id ? Number(user_id) : null,
      customer_name,
      customer_email,
      customer_phone,
      start_date,
      end_date,
      total_days: Number(total_days),
      total_price: Number(total_price),
      status,
      created_at: new Date().toISOString()
    };
    memoryStore.bookings.unshift(newBooking);
    return [{ insertId: newBooking.id, affectedRows: 1 }, []];
  }

  // Bookings: Select by user_id or customer_email
  if (lowerSql.includes("from bookings") && (lowerSql.includes("where b.user_id =") || lowerSql.includes("where user_id =") || lowerSql.includes("where customer_email ="))) {
    let bookings = [];
    const identifier = params[0];
    if (typeof identifier === "number" || !isNaN(Number(identifier))) {
      bookings = memoryStore.bookings.filter((b) => b.user_id === Number(identifier));
    }
    if (bookings.length === 0 && typeof identifier === "string") {
      bookings = memoryStore.bookings.filter((b) => b.customer_email?.toLowerCase() === identifier.toLowerCase());
    }

    // Join with product data if query expects b.* and p.name
    const result = bookings.map((b) => {
      const prod = memoryStore.products.find((p) => p.id === b.product_id) || {};
      return {
        ...b,
        product_name: prod.name || "Rental Item",
        product_image: prod.image || "",
        product_location: prod.location || "",
        product_price: prod.price || 0,
        category: prod.category || ""
      };
    });
    return [result, []];
  }

  // Bookings: Check date collision conflicts or select by product_id
  if (lowerSql.includes("from bookings") && lowerSql.includes("where product_id =")) {
    const prodId = Number(params[0]);
    let list = memoryStore.bookings.filter((b) => b.product_id === prodId && b.status === "confirmed");
    if (lowerSql.includes("start_date <=") && lowerSql.includes("end_date >=")) {
      const targetEndDate = params[1];
      const targetStartDate = params[2];
      list = list.filter((b) => b.start_date <= targetEndDate && b.end_date >= targetStartDate);
    }
    return [list, []];
  }

  // Bookings: Select all (Admin query)
  if (lowerSql.includes("from bookings") && !lowerSql.includes("where b.user_id =") && !lowerSql.includes("where user_id =") && !lowerSql.includes("where customer_email =")) {
    if (lowerSql.includes("count(*)")) {
      return [[{ total_bookings: memoryStore.bookings.length }], []];
    }
    if (lowerSql.includes("sum(total_price)")) {
      const rev = memoryStore.bookings.reduce((sum, b) => sum + (Number(b.total_price) || 0), 0);
      return [[{ total_revenue: rev, total_bookings: memoryStore.bookings.length }], []];
    }

    const result = memoryStore.bookings.map((b) => {
      const prod = memoryStore.products.find((p) => p.id === b.product_id) || {};
      return {
        ...b,
        product_name: b.product_name || prod.name || "Rental Item",
        product_image: b.product_image || prod.image || "",
        product_location: b.product_location || prod.location || "",
        product_price: b.product_price || prod.price || 0,
        category: b.category || prod.category || ""
      };
    });
    return [result, []];
  }

  // Users: Select all (Admin query)
  if (lowerSql.includes("from users") && !lowerSql.includes("where email =") && !lowerSql.includes("where id =")) {
    if (lowerSql.includes("count(*)")) {
      return [[{ total_users: memoryStore.users.length }], []];
    }
    const safeUsers = memoryStore.users.map((u) => ({
      id: u.id,
      full_name: u.full_name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      created_at: u.created_at
    }));
    return [safeUsers, []];
  }

  // Bookings: Update status / Cancel
  if (lowerSql.startsWith("update bookings set status =")) {
    const status = params[0];
    const id = Number(params[1]);
    const b = memoryStore.bookings.find((item) => item.id === id);
    if (b) b.status = status;
    return [{ affectedRows: b ? 1 : 0 }, []];
  }

  // Reviews: Select by product_id
  if (lowerSql.includes("from reviews") && lowerSql.includes("where product_id =")) {
    const prodId = Number(params[0]);
    const revs = memoryStore.reviews.filter((r) => r.product_id === prodId);
    return [revs, []];
  }

  // Reviews: Insert
  if (lowerSql.startsWith("insert into reviews")) {
    const [product_id, user_id, reviewer_name, rating, comment] = params;
    const newRev = {
      id: memoryStore.nextReviewId++,
      product_id: Number(product_id),
      user_id: user_id ? Number(user_id) : null,
      reviewer_name,
      rating: Number(rating),
      comment,
      created_at: new Date().toISOString().split("T")[0]
    };
    memoryStore.reviews.unshift(newRev);

    // Update product rating
    const prod = memoryStore.products.find((p) => p.id === Number(product_id));
    if (prod) {
      const prodReviews = memoryStore.reviews.filter((r) => r.product_id === prod.id);
      const avg = prodReviews.reduce((sum, r) => sum + r.rating, 0) / prodReviews.length;
      prod.rating = parseFloat(avg.toFixed(1));
      prod.reviews_count = prodReviews.length;
    }

    return [{ insertId: newRev.id, affectedRows: 1 }, []];
  }

  // Default empty return
  return [[], []];
}

// Pool interface wrapper
const pool = {
  query: executeQuery,
  execute: executeQuery,
  getConnection: async () => ({
    query: executeQuery,
    execute: executeQuery,
    release: () => {}
  }),
  isMySQLConnected: () => isMySQLConnected
};

module.exports = pool;