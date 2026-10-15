import { getFallbackImage } from "../utils/imageFallback";

function ProductCard({
  product,
  onRent,
  onViewDetails,
  isSaved = false,
  onToggleWishlist
}) {
  const isAvailable = product.available === true || product.available === 1;
  const initialImage = product.image || getFallbackImage(product.category, product.name);

  return (
    <div className="product-card">
      <div className="card-image-wrap">
        <img
          src={initialImage}
          alt={product.name}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = getFallbackImage(product.category, product.name);
          }}
        />
        <button
          type="button"
          className={`wishlist-btn ${isSaved ? "saved" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            if (onToggleWishlist) onToggleWishlist(product.id);
          }}
          title={isSaved ? "Remove from bookmarks" : "Bookmark for later"}
          aria-label="Bookmark item"
        >
          {isSaved ? (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="#198754" stroke="#198754" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          ) : (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          )}
        </button>
        <span className={`status-pill ${isAvailable ? "available" : "unavailable"}`}>
          {isAvailable ? "● Available" : "○ Rented"}
        </span>
      </div>

      <div className="product-info">
        <div className="product-header-row">
          <span className="product-category">{product.category}</span>
          <span className="product-rating" title="Community Rating">
            {Number(product.rating) > 0 ? (
              <>
                ⭐ {Number(product.rating).toFixed(1)}
                {product.reviews_count ? ` (${product.reviews_count})` : ""}
              </>
            ) : (
              "⭐ New"
            )}
          </span>
        </div>

        <h3 onClick={() => onViewDetails(product)} className="card-title-clickable">
          {product.name}
        </h3>

        <p className="product-description">{product.description}</p>

        <div className="product-meta">
          <span className="location">📍 {product.location}</span>
          <span className="owner-verified-pill" title="Verified Community Lender">
            🛡️ Verified Lender
          </span>
          {Number(product.security_deposit) > 0 && (
            <span className="deposit-badge" title="Refundable upon item return">
              ₹{Number(product.security_deposit).toLocaleString("en-IN")} Deposit
            </span>
          )}
        </div>

        <div className="product-bottom">
          <div className="price">
            <strong>₹{Number(product.price).toLocaleString("en-IN")}</strong>
            <span>/day</span>
          </div>

          <div className="card-actions">
            <button
              className="quick-view-btn"
              onClick={() => onViewDetails(product)}
              title="View full specs, deposit, and customer reviews"
            >
              Details
            </button>
            <button
              className="rent-button"
              disabled={!isAvailable}
              onClick={() => onRent(product)}
            >
              {isAvailable ? "Rent now →" : "Unavailable"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
