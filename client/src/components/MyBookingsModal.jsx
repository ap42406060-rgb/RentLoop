import { useState, useEffect, useCallback } from "react";
import { API_URL } from "../config/api";
import { getFallbackImage } from "../utils/imageFallback";

function MyBookingsModal({
  user,
  onClose,
  onBrowseItems
}) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState(null);

  const fetchBookings = useCallback(async () => {
    if (!user) return;
    try {
      setError("");

      const token = localStorage.getItem("rentloopToken");
      const headers = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(
        `${API_URL}/bookings/my-bookings?email=${encodeURIComponent(user.email)}`,
        { headers }
      );
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to load bookings.");
      }

      setBookings(data.bookings || []);
    } catch (err) {
      setError(err.message || "Unable to load your bookings.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (active) await fetchBookings();
    };
    load();
    return () => {
      active = false;
    };
  }, [fetchBookings]);

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;

    try {
      setCancellingId(bookingId);
      const token = localStorage.getItem("rentloopToken");
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_URL}/bookings/${bookingId}/cancel`, {
        method: "PATCH",
        headers
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to cancel booking.");
      }

      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: "cancelled" } : b))
      );
    } catch (err) {
      alert(err.message || "Unable to cancel booking.");
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "confirmed":
        return <span className="status-badge confirmed">✓ Confirmed</span>;
      case "pending":
        return <span className="status-badge pending">⏳ Pending</span>;
      case "completed":
        return <span className="status-badge completed">🏁 Completed</span>;
      case "cancelled":
        return <span className="status-badge cancelled">✕ Cancelled</span>;
      default:
        return <span className="status-badge confirmed">{status}</span>;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="rent-modal dashboard-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-modal" onClick={onClose} aria-label="Close">
          ×
        </button>

        <div className="dashboard-header">
          <h2>📋 My Rental Bookings</h2>
          <p>View your upcoming trips, active rentals, and past reservations.</p>
        </div>

        {loading ? (
          <div className="dashboard-loading">Loading your bookings...</div>
        ) : error ? (
          <div className="dashboard-error">
            <p>{error}</p>
            <button className="secondary-button" onClick={() => { setLoading(true); fetchBookings(); }}>
              Retry
            </button>
          </div>
        ) : bookings.length === 0 ? (
          <div className="dashboard-empty">
            <span className="empty-icon">📦</span>
            <h3>No bookings yet</h3>
            <p>You haven't rented any items yet. Start browsing gear near you!</p>
            <button
              className="confirm-button"
              onClick={() => {
                onClose();
                onBrowseItems();
              }}
            >
              Browse Items to Rent
            </button>
          </div>
        ) : (
          <div className="dashboard-list">
            {bookings.map((booking) => (
              <div key={booking.id} className="booking-card-item">
                <img
                  src={booking.product_image || getFallbackImage(booking.category, booking.product_name)}
                  alt={booking.product_name}
                  className="booking-item-thumb"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = getFallbackImage(booking.category, booking.product_name);
                  }}
                />

                <div className="booking-item-details">
                  <div className="booking-item-top">
                    <h4>{booking.product_name || "Rental Item"}</h4>
                    {getStatusBadge(booking.status)}
                  </div>

                  <p className="booking-ref">Reference: #{booking.id}</p>

                  <div className="booking-item-meta">
                    <span>
                      📅 <strong>{booking.start_date}</strong> to{" "}
                      <strong>{booking.end_date}</strong> ({booking.total_days} {booking.total_days === 1 ? "day" : "days"})
                    </span>
                    {booking.product_location && (
                      <span>📍 {booking.product_location}</span>
                    )}
                  </div>

                    <div className="booking-item-footer">
                      <span className="booking-cost">
                        Total: <strong>₹{Number(booking.total_price).toLocaleString("en-IN")}</strong>
                      </span>

                      <div className="booking-card-actions">
                        <button
                          type="button"
                          className="print-booking-voucher-btn"
                          onClick={() => window.print()}
                          title="Print or export PDF voucher"
                        >
                          🖨️ Voucher
                        </button>
                        {booking.status !== "cancelled" && (
                          <button
                            className="cancel-booking-btn"
                            disabled={cancellingId === booking.id}
                            onClick={() => handleCancelBooking(booking.id)}
                          >
                            {cancellingId === booking.id ? "Cancelling..." : "Cancel"}
                          </button>
                        )}
                      </div>
                    </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyBookingsModal;
