function Navbar({
  user,
  onOpenAuth,
  onLogout,
  onOpenListItem,
  onOpenMyBookings,
  onOpenMyListings,
  onOpenAdmin,
  bookingsCount = 0,
  listingsCount = 0,
  wishlistCount = 0,
  showSavedOnly = false,
  onToggleSavedFilter
}) {
  const isAdmin = user?.role === "admin";

  return (
    <nav className="navbar">
      <div className="logo" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
        Rent<span>Loop</span>
      </div>

      <div className="nav-links">
        <a href="#home">Home</a>
        <a href="#products">Browse Items</a>
        <a href="#how-it-works">How It Works</a>
      </div>

      <div className="nav-auth-buttons">
        {user ? (
          <>
            <span className={`welcome-user ${isAdmin ? "admin-user-pill" : ""}`}>
              {isAdmin ? "👑 Admin" : "👤"} {user.full_name?.split(" ")[0]}
            </span>

            {isAdmin && (
              <button
                className="nav-admin-btn"
                onClick={onOpenAdmin}
                title="Open Admin Management & Analytics Portal"
              >
                👑 Admin Portal
              </button>
            )}

            <button
              className="nav-secondary-btn"
              onClick={onOpenMyBookings}
              title="View your rental bookings"
            >
              📋 My Bookings
              {bookingsCount > 0 && <span className="nav-badge">{bookingsCount}</span>}
            </button>

            <button
              className="nav-secondary-btn"
              onClick={onOpenMyListings}
              title="View items you have listed"
            >
              📦 My Listings
              {listingsCount > 0 && <span className="nav-badge">{listingsCount}</span>}
            </button>

            <button className="auth-button logout-btn" onClick={onLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <button
              className="auth-button"
              onClick={() => onOpenAuth("login")}
            >
              Login
            </button>

            <button
              className="signup-button"
              onClick={() => onOpenAuth("signup")}
            >
              Sign Up
            </button>

            <button
              className="demo-admin-pill"
              onClick={() => onOpenAuth("admin-demo")}
              title="Quickly test the Admin Portal"
            >
              👑 Admin Demo
            </button>
          </>
        )}

        <button
          className={`nav-wishlist-btn ${showSavedOnly ? "active" : ""}`}
          onClick={onToggleSavedFilter}
          title={showSavedOnly ? "Show all items" : "Show your bookmarked gear"}
        >
          🔖 Saved Gear
          {wishlistCount > 0 && <span className="nav-badge wishlist-badge">{wishlistCount}</span>}
        </button>

        <button className="list-button" onClick={onOpenListItem}>
          + List an Item
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
