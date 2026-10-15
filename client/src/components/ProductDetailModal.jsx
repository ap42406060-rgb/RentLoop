import { useState, useEffect } from "react";
import { API_URL } from "../config/api";
import { getFallbackImage } from "../utils/imageFallback";

function ProductDetailModal({
  product,
  user,
  onClose,
  onRent,
  isSaved = false,
  onToggleWishlist
}) {
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [showAddReview, setShowAddReview] = useState(false);

  const [reviewerName, setReviewerName] = useState(user?.full_name || "");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState("");

  const isAvailable = product?.available === true || product?.available === 1;

  useEffect(() => {
    if (!product) return;
    let isMounted = true;
    const fetchReviews = async () => {
      try {
        const res = await fetch(`${API_URL}/reviews/${product.id}`);
        const data = await res.json();
        if (isMounted && data.success) {
          setReviews(data.reviews || []);
        }
      } catch (err) {
        console.error("Failed to load reviews:", err);
      } finally {
        if (isMounted) setLoadingReviews(false);
      }
    };
    fetchReviews();
    return () => {
      isMounted = false;
    };
  }, [product]);

  if (!product) return null;

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewError("");

    if (!reviewerName.trim()) {
      setReviewError("Please enter your name.");
      return;
    }

    try {
      setSubmittingReview(true);
      const token = localStorage.getItem("rentloopToken");
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_URL}/reviews/${product.id}`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          reviewer_name: reviewerName.trim(),
          rating: Number(rating),
          comment: comment.trim()
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Unable to save review.");
      }

      // Add new review to top of list
      const newReview = {
        id: data.reviewId || Date.now(),
        product_id: product.id,
        reviewer_name: reviewerName.trim(),
        rating: Number(rating),
        comment: comment.trim(),
        created_at: new Date().toISOString().split("T")[0]
      };
      setReviews([newReview, ...reviews]);
      setShowAddReview(false);
      setComment("");
    } catch (err) {
      setReviewError(err.message || "Failed to post review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="rent-modal detail-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-modal" onClick={onClose} aria-label="Close">
          ×
        </button>

        <div className="detail-hero-image-wrap">
          <img
            src={product.image || getFallbackImage(product.category, product.name)}
            alt={product.name}
            className="detail-modal-image"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = getFallbackImage(product.category, product.name);
            }}
          />
          <span className={`status-pill detail-pill ${isAvailable ? "available" : "unavailable"}`}>
            {isAvailable ? "● Available for Rent" : "○ Currently Rented"}
          </span>
        </div>

        <div className="detail-body">
          <div className="detail-tags-row">
            <span className="product-category">{product.category}</span>
            <span className="location">📍 {product.location}</span>
          </div>

          <h2>{product.name}</h2>

          <div className="detail-pricing-banner">
            <div>
              <span className="daily-label">Daily Rental Rate</span>
              <strong className="rate-amount">
                ₹{Number(product.price).toLocaleString("en-IN")}
                <span> / day</span>
              </strong>
            </div>

            {Number(product.security_deposit) > 0 && (
              <div className="deposit-box">
                <span className="deposit-title">Refundable Deposit</span>
                <strong>₹{Number(product.security_deposit).toLocaleString("en-IN")}</strong>
              </div>
            )}
          </div>

          {/* DURATION SAVER INCENTIVE */}
          <div className="duration-saver-callout">
            <span className="saver-icon">🎉</span>
            <div>
              <strong>Multi-Day Rental Saver Active</strong>
              <p>Rent 3+ days for 10% instant discount, or 7+ days for 20% weekly discount.</p>
            </div>
          </div>

          {/* OWNER TRUST & DIRECT INQUIRY */}
          <div className="owner-trust-strip">
            <div className="owner-trust-badge">
              <span className="owner-shield-icon">🛡️</span>
              <div>
                <strong>Verified Community Lender</strong>
                <p>99% on-time handover • Responds under 15 mins</p>
              </div>
            </div>
            <button
              type="button"
              className="chat-owner-btn"
              onClick={() => {
                const message = encodeURIComponent(
                  `Hi! I saw your "${product.name}" listing on RentLoop. Is it available for rent this week?`
                );
                window.open(`https://wa.me/919876543210?text=${message}`, "_blank");
              }}
              title="Send a quick inquiry to the owner"
            >
              💬 Inquire with Owner
            </button>
          </div>

          <div className="detail-section">
            <h3>Description & Specifications</h3>
            <p className="detail-description">{product.description}</p>
          </div>

          {/* EQUIPMENT VERIFICATION GRID */}
          <div className="equipment-specs-grid">
            <div className="spec-item">
              <span className="spec-label">Item Condition</span>
              <strong className="spec-val">✓ Grade A (Tested & Sanitized)</strong>
            </div>
            <div className="spec-item">
              <span className="spec-label">Handover Time</span>
              <strong className="spec-val">⚡ Instant / Same-Day Pickup</strong>
            </div>
            <div className="spec-item">
              <span className="spec-label">Package Inclusions</span>
              <strong className="spec-val">📦 Original Accessories & Cables</strong>
            </div>
            <div className="spec-item">
              <span className="spec-label">Deposit Security</span>
              <strong className="spec-val">🛡️ 100% Refundable via UPI</strong>
            </div>
          </div>

          {/* REVIEWS SECTION */}
          <div className="detail-section reviews-section">
            <div className="reviews-header-bar">
              <div>
                <h3>Customer Reviews</h3>
                <span className="average-rating-label">
                  ⭐ {Number(product.rating || 5.0).toFixed(1)} / 5 ({reviews.length > 0 ? reviews.length : (product.reviews_count || 1)} verified reviews)
                </span>
              </div>
              <button
                className="add-review-toggle-btn"
                onClick={() => setShowAddReview(!showAddReview)}
              >
                {showAddReview ? "Cancel Review" : "+ Write a Review"}
              </button>
            </div>

            {showAddReview && (
              <form onSubmit={handleReviewSubmit} className="add-review-form">
                <h4>Leave Your Feedback</h4>
                <div className="review-form-row">
                  <div>
                    <label>Your Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Ananya"
                      value={reviewerName}
                      onChange={(e) => setReviewerName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label>Rating</label>
                    <select
                      value={rating}
                      onChange={(e) => setRating(e.target.value)}
                      className="select-input"
                    >
                      <option value="5">⭐⭐⭐⭐⭐ (5 - Excellent)</option>
                      <option value="4">⭐⭐⭐⭐ (4 - Very Good)</option>
                      <option value="3">⭐⭐⭐ (3 - Average)</option>
                      <option value="2">⭐⭐ (2 - Below Average)</option>
                      <option value="1">⭐ (1 - Poor)</option>
                    </select>
                  </div>
                </div>

                <label>Review / Experience</label>
                <textarea
                  rows="2"
                  placeholder="How was the product condition and handoff experience?"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  required
                />

                {reviewError && <p className="booking-error">{reviewError}</p>}

                <button
                  className="confirm-button"
                  type="submit"
                  disabled={submittingReview}
                >
                  {submittingReview ? "Submitting..." : "Submit Review"}
                </button>
              </form>
            )}

            {loadingReviews ? (
              <p className="reviews-loading">Loading verified reviews...</p>
            ) : reviews.length > 0 ? (
              <div className="reviews-list">
                {reviews.map((rev) => (
                  <div key={rev.id} className="review-card">
                    <div className="review-header">
                      <div className="reviewer-info">
                        <span className="reviewer-avatar">
                          {rev.reviewer_name?.charAt(0) || "U"}
                        </span>
                        <div>
                          <strong>{rev.reviewer_name}</strong>
                          <span className="review-date">{rev.created_at || "Recent"}</span>
                        </div>
                      </div>
                      <div className="review-stars">
                        {"⭐".repeat(Math.min(Math.max(Number(rev.rating) || 5, 1), 5))}
                      </div>
                    </div>
                    {rev.comment && <p className="review-comment">"{rev.comment}"</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-reviews-note">
                No reviews yet. Be the first to rent and review this item!
              </p>
            )}
          </div>

          <div className="detail-modal-footer">
            <button className="secondary-button" onClick={onClose}>
              Back to Catalog
            </button>
            <button
              type="button"
              className={`wishlist-toggle-detail-btn ${isSaved ? "saved" : ""}`}
              onClick={() => onToggleWishlist && onToggleWishlist(product.id)}
              title={isSaved ? "Remove from bookmarks" : "Bookmark for later"}
            >
              {isSaved ? "🔖 Bookmarked" : "🔖 Bookmark for Later"}
            </button>
            <button
              className="confirm-button"
              disabled={!isAvailable}
              onClick={() => {
                onClose();
                onRent(product);
              }}
            >
              {isAvailable ? "Rent This Item Now →" : "Item Unavailable"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetailModal;
