import { useState, useEffect, useCallback } from "react";
import { API_URL } from "../config/api";
import { getFallbackImage } from "../utils/imageFallback";

function MyListingsModal({
  user,
  onClose,
  onOpenListItem
}) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchListings = useCallback(async () => {
    if (!user) return;
    try {
      setError("");

      const token = localStorage.getItem("rentloopToken");
      const res = await fetch(`${API_URL}/products/user/my-listings`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to load listings.");
      }

      setListings(data.listings || []);
    } catch (err) {
      setError(err.message || "Unable to load your listings.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (active) await fetchListings();
    };
    load();
    return () => {
      active = false;
    };
  }, [fetchListings]);

  const handleToggleAvailability = async (product) => {
    try {
      setActionLoadingId(product.id);
      const newAvailability = !(product.available === true || product.available === 1);
      const token = localStorage.getItem("rentloopToken");

      const res = await fetch(`${API_URL}/products/${product.id}/availability`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ available: newAvailability })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update availability.");
      }

      setListings((prev) =>
        prev.map((item) =>
          item.id === product.id ? { ...item, available: newAvailability } : item
        )
      );
    } catch (err) {
      alert(err.message || "Could not update availability.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteListing = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this listing?")) return;

    try {
      setActionLoadingId(productId);
      const token = localStorage.getItem("rentloopToken");

      const res = await fetch(`${API_URL}/products/${productId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to delete listing.");
      }

      setListings((prev) => prev.filter((item) => item.id !== productId));
    } catch (err) {
      alert(err.message || "Could not delete listing.");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="rent-modal dashboard-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-modal" onClick={onClose} aria-label="Close">
          ×
        </button>

        <div className="dashboard-header">
          <div className="dashboard-title-row">
            <div>
              <h2>📦 My Listed Items</h2>
              <p>Manage items you are sharing on RentLoop</p>
            </div>
            <button
              className="list-button"
              onClick={() => {
                onClose();
                onOpenListItem();
              }}
            >
              + List New Item
            </button>
          </div>
        </div>

        {loading ? (
          <div className="dashboard-loading">Loading your listings...</div>
        ) : error ? (
          <div className="dashboard-error">
            <p>{error}</p>
            <button className="secondary-button" onClick={() => { setLoading(true); fetchListings(); }}>
              Retry
            </button>
          </div>
        ) : listings.length === 0 ? (
          <div className="dashboard-empty">
            <span className="empty-icon">🏷️</span>
            <h3>No items listed yet</h3>
            <p>You haven't listed any items for rent yet. Put your unused gear to work!</p>
            <button
              className="confirm-button"
              onClick={() => {
                onClose();
                onOpenListItem();
              }}
            >
              List Your First Item
            </button>
          </div>
        ) : (
          <div className="dashboard-list">
            {listings.map((item) => {
              const isAvailable = item.available === true || item.available === 1;

              return (
                <div key={item.id} className="booking-card-item">
                  <img
                    src={item.image || getFallbackImage(item.category, item.name)}
                    alt={item.name}
                    className="booking-item-thumb"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = getFallbackImage(item.category, item.name);
                    }}
                  />

                  <div className="booking-item-details">
                    <div className="booking-item-top">
                      <h4>{item.name}</h4>
                      <span className={`status-badge ${isAvailable ? "confirmed" : "pending"}`}>
                        {isAvailable ? "● Live / Available" : "○ Marked as Rented"}
                      </span>
                    </div>

                    <div className="booking-item-meta">
                      <span>🏷️ {item.category}</span>
                      <span>📍 {item.location}</span>
                      <span>
                        💰 <strong>₹{Number(item.price).toLocaleString("en-IN")}</strong> / day
                      </span>
                    </div>

                    <div className="listing-item-actions">
                      <button
                        className="secondary-btn-sm"
                        disabled={actionLoadingId === item.id}
                        onClick={() => handleToggleAvailability(item)}
                      >
                        {isAvailable ? "Mark Rented" : "Mark Available"}
                      </button>

                      <button
                        className="delete-btn-sm"
                        disabled={actionLoadingId === item.id}
                        onClick={() => handleDeleteListing(item.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyListingsModal;
