import { useState, useEffect, useMemo } from "react";
import "./App.css";

import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Categories from "./components/Categories";
import ProductCard from "./components/ProductCard";
import RentModal from "./components/RentModal";
import ListItemModal from "./components/ListItemModal";
import ProductDetailModal from "./components/ProductDetailModal";
import MyBookingsModal from "./components/MyBookingsModal";
import MyListingsModal from "./components/MyListingsModal";
import AuthModal from "./components/AuthModal";
import AdminModal from "./components/AdminModal";
import Toast from "./components/Toast";

import { API_URL } from "./config/api";
import { DEFAULT_PRODUCTS } from "./data/defaultProducts";

function App() {
  // Products initialized with default catalog so photos and items are ALWAYS visible!
  const [products, setProducts] = useState(DEFAULT_PRODUCTS);
  const [loading, setLoading] = useState(false);
  const [backendOffline, setBackendOffline] = useState(false);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("popular");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [pricePreset, setPricePreset] = useState("all");

  const handlePricePreset = (preset) => {
    setPricePreset(preset);
    if (preset === "all") {
      setMinPrice("");
      setMaxPrice("");
    } else if (preset === "under400") {
      setMinPrice("");
      setMaxPrice("399");
    } else if (preset === "400to800") {
      setMinPrice("400");
      setMaxPrice("800");
    } else if (preset === "800to1200") {
      setMinPrice("800");
      setMaxPrice("1200");
    } else if (preset === "above1200") {
      setMinPrice("1200");
      setMaxPrice("");
    }
  };

  const handleResetFilters = () => {
    setSearch("");
    setSelectedCategory("All");
    setAvailableOnly(false);
    setShowSavedOnly(false);
    setMinPrice("");
    setMaxPrice("");
    setPricePreset("all");
    setSortBy("popular");
  };

  // Saved Items / Wishlist
  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem("rentloopWishlist");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleWishlist = (productId) => {
    setWishlist((prev) => {
      const isAlreadySaved = prev.includes(productId);
      const next = isAlreadySaved
        ? prev.filter((id) => id !== productId)
        : [...prev, productId];
      try {
        localStorage.setItem("rentloopWishlist", JSON.stringify(next));
      } catch (err) {
        console.warn("Could not save wishlist:", err);
      }
      showToast(
        isAlreadySaved
          ? "Item removed from Bookmarks."
          : "Saved to your Bookmarks! 🔖",
        "info"
      );
      return next;
    });
  };

  // Authenticated User
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("rentloopUser");
      const savedToken = localStorage.getItem("rentloopToken");
      if (savedUser && savedToken) {
        return JSON.parse(savedUser);
      }
    } catch (err) {
      console.error("Error restoring user session:", err);
    }
    return null;
  });

  // User counters for badge indicators
  const [bookingsCount, setBookingsCount] = useState(0);
  const [listingsCount, setListingsCount] = useState(0);

  // Modals state
  const [authModal, setAuthModal] = useState({ open: false, mode: "login" });
  const [rentingProduct, setRentingProduct] = useState(null);
  const [detailProduct, setDetailProduct] = useState(null);
  const [showListItemModal, setShowListItemModal] = useState(false);
  const [showMyBookings, setShowMyBookings] = useState(false);
  const [showMyListings, setShowMyListings] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);

  // Toast Notification
  const [toast, setToast] = useState({ message: "", type: "success" });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const closeToast = () => {
    setToast({ message: "", type: "success" });
  };

  // ==========================================
  // 1. FETCH PRODUCTS
  // ==========================================
  const reloadProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/products`);
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load products from server.");
      }
      setProducts(data.products || DEFAULT_PRODUCTS);
      setBackendOffline(false);
      showToast("Connected to live RentLoop backend!", "success");
    } catch {
      setBackendOffline(true);
      setProducts((prev) => (prev.length > 0 ? prev : DEFAULT_PRODUCTS));
      showToast("Backend offline. Running in Demo Preview mode.", "info");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const response = await fetch(`${API_URL}/products`);
        const data = await response.json();
        if (isMounted) {
          if (response.ok && data.success && Array.isArray(data.products) && data.products.length > 0) {
            setProducts(data.products);
            setBackendOffline(false);
          } else {
            setBackendOffline(true);
          }
        }
      } catch {
        if (isMounted) {
          setBackendOffline(true);
        }
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  // ==========================================
  // 2. FETCH USER STATS (BOOKINGS & LISTINGS)
  // ==========================================
  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    const loadStats = async () => {
      try {
        const token = localStorage.getItem("rentloopToken");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const bRes = await fetch(
          `${API_URL}/bookings/my-bookings?email=${encodeURIComponent(user.email)}`,
          { headers }
        );
        const bData = await bRes.json();
        if (isMounted && bData.success) {
          setBookingsCount(bData.count || bData.bookings?.length || 0);
        }

        if (token) {
          const lRes = await fetch(`${API_URL}/products/user/my-listings`, { headers });
          const lData = await lRes.json();
          if (isMounted && lData.success) {
            setListingsCount(lData.count || lData.listings?.length || 0);
          }
        }
      } catch (err) {
        console.error("Error loading user stats:", err);
      }
    };
    loadStats();
    return () => {
      isMounted = false;
    };
  }, [user]);

  // ==========================================
  // 3. AUTH ACTIONS
  // ==========================================
  const handleAuthSuccess = (authenticatedUser, successMessage) => {
    setUser(authenticatedUser);
    showToast(successMessage, "success");
    if (authenticatedUser?.role === "admin") {
      setShowAdminModal(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("rentloopToken");
    localStorage.removeItem("rentloopUser");
    setUser(null);
    setBookingsCount(0);
    setListingsCount(0);
    showToast("You have been logged out successfully.", "info");
  };

  // ==========================================
  // 4. CATEGORIES, FEATURED & FILTERING
  // ==========================================
  const categories = useMemo(() => {
    const list = new Set([
      "All",
      "Electronics",
      "Cameras & Photography",
      "Gaming",
      "Audio Equipment",
      "Projectors",
      "Transportation",
      "Outdoor & Camping",
      "Tools & Equipment",
      "Furniture",
      "Home Appliances",
      "Event Equipment"
    ]);
    products.forEach((p) => {
      if (p.category) list.add(p.category);
    });
    return Array.from(list);
  }, [products]);

  // Featured Rentals (top-rated community equipment)
  const featuredProducts = useMemo(() => {
    return products
      .filter((p) => Number(p.rating) >= 4.8 && (p.available === true || p.available === 1))
      .slice(0, 4);
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search filter
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (p) =>
          (p.name || "").toLowerCase().includes(q) ||
          (p.description || "").toLowerCase().includes(q) ||
          (p.location || "").toLowerCase().includes(q) ||
          (p.category || "").toLowerCase().includes(q)
      );
    }

    // Category filter
    if (selectedCategory !== "All") {
      result = result.filter(
        (p) => (p.category || "").toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Price range filter
    if (minPrice !== "" && !isNaN(Number(minPrice))) {
      result = result.filter((p) => Number(p.price) >= Number(minPrice));
    }
    if (maxPrice !== "" && !isNaN(Number(maxPrice))) {
      result = result.filter((p) => Number(p.price) <= Number(maxPrice));
    }

    // Available only filter
    if (availableOnly) {
      result = result.filter((p) => p.available === true || p.available === 1);
    }

    // Wishlist / Saved Only filter
    if (showSavedOnly) {
      result = result.filter((p) => wishlist.includes(p.id));
    }

    // Sorting
    if (sortBy === "price_asc") {
      result.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortBy === "price_desc") {
      result.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (sortBy === "rating") {
      result.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    } else if (sortBy === "newest") {
      result.sort((a, b) => Number(b.id) - Number(a.id));
    }

    return result;
  }, [products, search, selectedCategory, minPrice, maxPrice, availableOnly, sortBy, showSavedOnly, wishlist]);

  // Scroll to products
  const scrollToProducts = () => {
    document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
  };

  // ==========================================
  // 5. BOOKING & LISTING SUCCESS HANDLERS
  // ==========================================
  const handleBookingSuccess = (booking) => {
    showToast(`Booking #${booking.id} confirmed!`, "success");
    setBookingsCount((prev) => prev + 1);
  };

  const handleProductCreated = (newProduct) => {
    setProducts((prev) => [newProduct, ...prev]);
    setListingsCount((prev) => prev + 1);
    showToast(`"${newProduct.name}" listed successfully!`, "success");
    scrollToProducts();
  };

  return (
    <div className="app">
      {/* FLOATING TOAST NOTIFICATION */}
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={closeToast}
      />

      {/* NAVBAR */}
      <Navbar
        user={user}
        bookingsCount={bookingsCount}
        listingsCount={listingsCount}
        wishlistCount={wishlist.length}
        showSavedOnly={showSavedOnly}
        onToggleSavedFilter={() => {
          setShowSavedOnly((prev) => !prev);
          scrollToProducts();
        }}
        onOpenAuth={(mode) => setAuthModal({ open: true, mode })}
        onLogout={handleLogout}
        onOpenListItem={() => setShowListItemModal(true)}
        onOpenMyBookings={() => setShowMyBookings(true)}
        onOpenMyListings={() => setShowMyListings(true)}
        onOpenAdmin={() => setShowAdminModal(true)}
      />

      {/* HERO SECTION */}
      <Hero
        search={search}
        setSearch={setSearch}
        onSearchSubmit={scrollToProducts}
        onQuickCategory={(cat) => {
          setSelectedCategory(cat);
          scrollToProducts();
        }}
      />

      {/* CATEGORIES STRIP */}
      <Categories
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          scrollToProducts();
        }}
      />

      {/* HOMEPAGE FEATURED SPOTLIGHT SECTION */}
      {selectedCategory === "All" && !search && !showSavedOnly && pricePreset === "all" && featuredProducts.length > 0 && (
        <section className="featured-section">
          <div className="section-header featured-header">
            <div>
              <span className="featured-pill">🔥 Community Favorites</span>
              <h2>Featured Rentals</h2>
              <p>Top-rated, verified equipment ready for instant handover today in Bangalore</p>
            </div>
            <button className="browse-all-btn" onClick={scrollToProducts}>
              Explore Full Catalog ({products.length}) ↓
            </button>
          </div>

          <div className="product-grid featured-grid">
            {featuredProducts.map((product) => (
              <ProductCard
                key={`featured-${product.id}`}
                product={product}
                isSaved={wishlist.includes(product.id)}
                onToggleWishlist={toggleWishlist}
                onRent={(p) => setRentingProduct(p)}
                onViewDetails={(p) => setDetailProduct(p)}
              />
            ))}
          </div>
        </section>
      )}

      {/* PRODUCTS CATALOG SECTION */}
      <section className="products-section" id="products">
        {backendOffline && (
          <div className="offline-banner">
            <span className="offline-icon">⚡</span>
            <div className="offline-text">
              <strong>Demo Preview Mode:</strong> All products & photos are active. To connect live database, start backend with: <code>cd server && npm run dev</code>
            </div>
            <button onClick={reloadProducts} className="retry-mini-btn" disabled={loading}>
              {loading ? "Checking..." : "Reconnect"}
            </button>
          </div>
        )}

        <div className="section-header catalog-header">
          <div>
            <h2>Explore Rental Catalog</h2>
            <p>
              Showing {filteredProducts.length} {filteredProducts.length === 1 ? "item" : "items"}
              {selectedCategory !== "All" ? ` in ${selectedCategory}` : ""}
              {search ? ` for "${search}"` : ""}
              {(minPrice || maxPrice) ? ` (₹${minPrice || "0"} – ₹${maxPrice || "any"})` : ""}
            </p>
          </div>

          {/* FILTER CONTROLS TOOLBAR */}
          <div className="catalog-toolbar">
            <label className="available-toggle">
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={(e) => setAvailableOnly(e.target.checked)}
              />
              <span>Available Only</span>
            </label>

            <div className="sort-box">
              <label htmlFor="sort-select">Sort by:</label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="select-input"
              >
                <option value="popular">Most Popular</option>
                <option value="rating">Highest Rated</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="newest">Recently Added</option>
              </select>
            </div>
          </div>
        </div>

        {/* PRICE FILTER BAR */}
        <div className="price-filter-bar">
          <div className="price-preset-chips">
            <span className="filter-label">Filter Price:</span>
            <button
              type="button"
              className={`preset-chip ${pricePreset === "all" ? "active" : ""}`}
              onClick={() => handlePricePreset("all")}
            >
              All Prices
            </button>
            <button
              type="button"
              className={`preset-chip ${pricePreset === "under400" ? "active" : ""}`}
              onClick={() => handlePricePreset("under400")}
            >
              Under ₹400
            </button>
            <button
              type="button"
              className={`preset-chip ${pricePreset === "400to800" ? "active" : ""}`}
              onClick={() => handlePricePreset("400to800")}
            >
              ₹400 – ₹800
            </button>
            <button
              type="button"
              className={`preset-chip ${pricePreset === "800to1200" ? "active" : ""}`}
              onClick={() => handlePricePreset("800to1200")}
            >
              ₹800 – ₹1,200
            </button>
            <button
              type="button"
              className={`preset-chip ${pricePreset === "above1200" ? "active" : ""}`}
              onClick={() => handlePricePreset("above1200")}
            >
              ₹1,200+
            </button>
          </div>

          <div className="price-custom-inputs">
            <span className="custom-price-label">Custom:</span>
            <div className="input-with-currency">
              <span>₹</span>
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => {
                  setPricePreset("custom");
                  setMinPrice(e.target.value);
                }}
                className="price-input"
                min="0"
              />
            </div>
            <span className="price-separator">–</span>
            <div className="input-with-currency">
              <span>₹</span>
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => {
                  setPricePreset("custom");
                  setMaxPrice(e.target.value);
                }}
                className="price-input"
                min="0"
              />
            </div>
            {(search || selectedCategory !== "All" || availableOnly || showSavedOnly || minPrice !== "" || maxPrice !== "" || sortBy !== "popular") && (
              <button
                type="button"
                className="reset-filters-btn"
                onClick={handleResetFilters}
                title="Reset all search, category, and price filters"
              >
                ✕ Reset
              </button>
            )}
          </div>
        </div>

        {/* LOADING STATE */}
        {loading && (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading rental catalog...</p>
          </div>
        )}

        {/* SAVED GEAR ACTIVE FILTER BANNER */}
        {showSavedOnly && (
          <div className="saved-filter-active-banner">
            <div className="saved-banner-info">
              <span className="saved-banner-icon">🔖</span>
              <div>
                <strong>Showing Your Bookmarked Gear ({filteredProducts.length} {filteredProducts.length === 1 ? "item" : "items"})</strong>
                <p>Items you bookmarked for quick comparison and easy rental reservation.</p>
              </div>
            </div>
            <button
              className="clear-saved-filter-btn"
              onClick={() => setShowSavedOnly(false)}
            >
              Show All Gear
            </button>
          </div>
        )}

        {/* PRODUCT GRID - ALWAYS VISIBLE WITH FULL PHOTOS */}
        <div className="product-grid">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isSaved={wishlist.includes(product.id)}
                onToggleWishlist={toggleWishlist}
                onRent={(p) => setRentingProduct(p)}
                onViewDetails={(p) => setDetailProduct(p)}
              />
            ))
          ) : (
            <div className="no-products">
              <h3>{showSavedOnly ? "No bookmarked items yet" : "No items matched your search"}</h3>
              <p>
                {showSavedOnly
                  ? "Click the bookmark icon on any gear card to save it for easy access!"
                  : "Try tweaking your filters or search keywords."}
              </p>
              <button
                className="clear-all-filters-btn"
                onClick={handleResetFilters}
              >
                {showSavedOnly ? "Browse All Equipment" : "Clear All Filters"}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how-it-works" id="how-it-works">
        <h2>How RentLoop Works</h2>
        <p className="section-subtitle">Rent anything in 3 easy, safe steps.</p>

        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Discover & Compare</h3>
            <p>Search high-quality cameras, gaming consoles, bikes, tents, and tools near you.</p>
          </div>

          <div className="step">
            <div className="step-number">2</div>
            <h3>Reserve & Secure</h3>
            <p>Choose your dates, review daily rates and deposit, and reserve in under a minute.</p>
          </div>

          <div className="step">
            <div className="step-number">3</div>
            <h3>Pick Up & Enjoy</h3>
            <p>Meet the local owner or arrange handoff, complete your project, and return with ease.</p>
          </div>
        </div>
      </section>

      {/* EARN WITH RENTLOOP */}
      <section className="earn-section">
        <div>
          <h2>Have high-value gear gathering dust?</h2>
          <p>
            Turn your unused cameras, drones, camping kits, and gaming consoles into monthly
            rental income with RentLoop's trusted peer protection.
          </p>
          <button
            className="earn-button"
            onClick={() => setShowListItemModal(true)}
          >
            List Your Item Today →
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-logo">
          Rent<span>Loop</span>
        </div>
        <p>Rent more. Buy less. Share sustainably.</p>
        <div className="footer-links">
          <span>Bangalore, India</span> • <span>Fast Peer Rentals</span> • <span>Verified Community</span>
        </div>
        <p className="copyright">© 2026 RentLoop Marketplace. All rights reserved.</p>
      </footer>

      {/* ==========================================
          MODALS
      ========================================== */}

      {/* 1. AUTH MODAL */}
      {authModal.open && (
        <AuthModal
          initialMode={authModal.mode}
          onClose={() => setAuthModal({ open: false, mode: "login" })}
          onAuthSuccess={handleAuthSuccess}
        />
      )}

      {/* 2. RENT BOOKING MODAL */}
      {rentingProduct && (
        <RentModal
          product={rentingProduct}
          user={user}
          onClose={() => setRentingProduct(null)}
          onBookingSuccess={handleBookingSuccess}
        />
      )}

      {/* 3. PRODUCT DETAIL & REVIEWS MODAL */}
      {detailProduct && (
        <ProductDetailModal
          product={detailProduct}
          user={user}
          isSaved={wishlist.includes(detailProduct.id)}
          onToggleWishlist={toggleWishlist}
          onClose={() => setDetailProduct(null)}
          onRent={(p) => setRentingProduct(p)}
        />
      )}

      {/* 4. LIST AN ITEM MODAL */}
      {showListItemModal && (
        <ListItemModal
          user={user}
          onClose={() => setShowListItemModal(false)}
          onRequireLogin={() => setAuthModal({ open: true, mode: "login" })}
          onProductCreated={handleProductCreated}
        />
      )}

      {/* 5. MY BOOKINGS MODAL */}
      {showMyBookings && (
        <MyBookingsModal
          user={user}
          onClose={() => setShowMyBookings(false)}
          onBrowseItems={() => {
            setShowMyBookings(false);
            scrollToProducts();
          }}
        />
      )}

      {/* 6. MY LISTINGS MODAL */}
      {showMyListings && (
        <MyListingsModal
          user={user}
          onClose={() => setShowMyListings(false)}
          onOpenListItem={() => {
            setShowMyListings(false);
            setShowListItemModal(true);
          }}
        />
      )}

      {/* 7. ADMIN MANAGEMENT & ITEM ORDERS ANALYTICS MODAL */}
      {showAdminModal && (
        <AdminModal
          user={user}
          onClose={() => setShowAdminModal(false)}
          onRefreshCatalog={reloadProducts}
        />
      )}
    </div>
  );
}

export default App;