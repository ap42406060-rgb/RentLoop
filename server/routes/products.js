const express = require("express");
const pool = require("../db");
const { verifyToken, optionalAuth } = require("../middleware/auth");

const router = express.Router();

// ==========================================
// 1. GET ALL PRODUCTS (WITH FILTERS & SORT)
// ==========================================
router.get("/", async (req, res) => {
  try {
    const { search, category, sort, available, minPrice, maxPrice } = req.query;

    const [allProducts] = await pool.query(
      "SELECT * FROM products ORDER BY id DESC"
    );

    let products = Array.isArray(allProducts) ? [...allProducts] : [];

    // Filter by search keyword
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      products = products.filter(
        (p) =>
          (p.name || "").toLowerCase().includes(q) ||
          (p.description || "").toLowerCase().includes(q) ||
          (p.location || "").toLowerCase().includes(q) ||
          (p.category || "").toLowerCase().includes(q)
      );
    }

    // Filter by category
    if (category && category !== "All") {
      products = products.filter(
        (p) => (p.category || "").toLowerCase() === category.toLowerCase()
      );
    }

    // Filter by price range
    if (minPrice !== undefined && minPrice !== "" && !isNaN(Number(minPrice))) {
      products = products.filter((p) => Number(p.price) >= Number(minPrice));
    }
    if (maxPrice !== undefined && maxPrice !== "" && !isNaN(Number(maxPrice))) {
      products = products.filter((p) => Number(p.price) <= Number(maxPrice));
    }

    // Filter by availability
    if (available === "true") {
      products = products.filter((p) => p.available === true || p.available === 1);
    }

    // Sorting
    if (sort === "price_asc") {
      products.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sort === "price_desc") {
      products.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (sort === "rating") {
      products.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    } else if (sort === "newest") {
      products.sort((a, b) => Number(b.id) - Number(a.id));
    }

    return res.json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    console.error("Fetch products error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to load products. Please try again."
    });
  }
});

// ==========================================
// 2. GET CURRENT USER'S LISTED ITEMS
// ==========================================
router.get("/user/my-listings", verifyToken, async (req, res) => {
  try {
    const [listings] = await pool.query(
      "SELECT * FROM products WHERE owner_id = ? ORDER BY id DESC",
      [req.user.id]
    );

    return res.json({
      success: true,
      count: listings.length,
      listings: listings || []
    });
  } catch (error) {
    console.error("Fetch user listings error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to load your listed items."
    });
  }
});

// ==========================================
// 3. GET SINGLE PRODUCT BY ID
// ==========================================
router.get("/:id", async (req, res) => {
  try {
    const productId = Number(req.params.id);

    const [products] = await pool.query(
      "SELECT * FROM products WHERE id = ?",
      [productId]
    );

    if (!products || products.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found."
      });
    }

    const product = products[0];

    // Fetch reviews for this product
    const [reviews] = await pool.query(
      "SELECT * FROM reviews WHERE product_id = ? ORDER BY id DESC",
      [productId]
    );

    return res.json({
      success: true,
      product: {
        ...product,
        reviews: reviews || []
      }
    });
  } catch (error) {
    console.error("Fetch product details error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to load product details."
    });
  }
});

// ==========================================
// 4. CREATE / LIST NEW PRODUCT
// ==========================================
router.post("/", verifyToken, async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      price,
      security_deposit,
      location,
      image
    } = req.body;

    if (!name?.trim() || !category?.trim() || !price || !location?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please fill in title, category, price, and location."
      });
    }

    if (Number(price) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Daily rental price must be greater than 0."
      });
    }

    // Default placeholder image if none provided
    const defaultImage =
      "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80";

    const [result] = await pool.execute(
      `INSERT INTO products (name, description, category, price, security_deposit, location, image, owner_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        description?.trim() || "",
        category.trim(),
        Number(price),
        Number(security_deposit || 0),
        location.trim(),
        image?.trim() || defaultImage,
        req.user.id
      ]
    );

    const newProduct = {
      id: result.insertId,
      name: name.trim(),
      description: description?.trim() || "",
      category: category.trim(),
      price: Number(price),
      security_deposit: Number(security_deposit || 0),
      location: location.trim(),
      image: image?.trim() || defaultImage,
      owner_id: req.user.id,
      available: true,
      rating: 5.0,
      reviews_count: 0
    };

    return res.status(201).json({
      success: true,
      message: "Your item has been listed successfully!",
      product: newProduct
    });
  } catch (error) {
    console.error("Create product error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to list item. Please try again."
    });
  }
});

// ==========================================
// 5. UPDATE PRODUCT DETAILS
// ==========================================
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const productId = Number(req.params.id);
    const { name, description, category, price, location } = req.body;

    // Verify ownership
    const [products] = await pool.query(
      "SELECT * FROM products WHERE id = ?",
      [productId]
    );

    if (!products || products.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found."
      });
    }

    const product = products[0];
    if (product.owner_id && product.owner_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to edit this listing."
      });
    }

    await pool.execute(
      `UPDATE products
       SET name = ?, description = ?, category = ?, price = ?, location = ?
       WHERE id = ?`,
      [
        name?.trim() || product.name,
        description?.trim() || product.description,
        category?.trim() || product.category,
        price ? Number(price) : product.price,
        location?.trim() || product.location,
        productId
      ]
    );

    return res.json({
      success: true,
      message: "Listing updated successfully!"
    });
  } catch (error) {
    console.error("Update product error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update listing."
    });
  }
});

// ==========================================
// 6. TOGGLE AVAILABILITY
// ==========================================
router.patch("/:id/availability", verifyToken, async (req, res) => {
  try {
    const productId = Number(req.params.id);
    const { available } = req.body;

    await pool.execute(
      "UPDATE products SET available = ? WHERE id = ?",
      [available ? 1 : 0, productId]
    );

    return res.json({
      success: true,
      message: `Product marked as ${available ? "available" : "unavailable"}.`
    });
  } catch (error) {
    console.error("Update availability error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update availability."
    });
  }
});

// ==========================================
// 7. DELETE PRODUCT
// ==========================================
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const productId = Number(req.params.id);

    // Verify ownership
    const [products] = await pool.query(
      "SELECT * FROM products WHERE id = ?",
      [productId]
    );

    if (!products || products.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found."
      });
    }

    const product = products[0];
    if (product.owner_id && product.owner_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this listing."
      });
    }

    await pool.execute("DELETE FROM products WHERE id = ?", [productId]);

    return res.json({
      success: true,
      message: "Listing deleted successfully."
    });
  } catch (error) {
    console.error("Delete product error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to delete listing."
    });
  }
});

module.exports = router;
