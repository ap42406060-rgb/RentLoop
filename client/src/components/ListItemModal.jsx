import { useState } from "react";
import { API_URL } from "../config/api";

const IMAGE_PRESETS = [
  {
    name: "Camera",
    url: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "Drone",
    url: "https://images.unsplash.com/photo-1507582020432-2a3bc418123f?auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "PlayStation",
    url: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "Bicycle",
    url: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "Tent",
    url: "https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "Speaker",
    url: "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "Power Tools",
    url: "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "Projector",
    url: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=800&q=80"
  }
];

function ListItemModal({
  user,
  onClose,
  onRequireLogin,
  onProductCreated
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Cameras");
  const [price, setPrice] = useState("");
  const [deposit, setDeposit] = useState("");
  const [location, setLocation] = useState("Bangalore, India");
  const [image, setImage] = useState(IMAGE_PRESETS[0].url);
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!user) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="rent-modal auth-notice-modal" onClick={(e) => e.stopPropagation()}>
          <button className="close-modal" onClick={onClose} aria-label="Close">
            ×
          </button>
          <div className="auth-notice-content">
            <span className="notice-icon">🔐</span>
            <h2>Log In to List an Item</h2>
            <p>
              Join thousands of owners on RentLoop earning extra income from their unused items.
              Please log in or sign up to list your item.
            </p>
            <button
              className="confirm-button"
              onClick={() => {
                onClose();
                onRequireLogin();
              }}
            >
              Log In / Sign Up Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please enter the item title.");
      return;
    }

    if (!price || Number(price) <= 0) {
      setError("Please enter a valid daily rental rate greater than ₹0.");
      return;
    }

    if (!location.trim()) {
      setError("Please specify the item location / neighbourhood.");
      return;
    }

    try {
      setLoading(true);

      const token = localStorage.getItem("rentloopToken");
      const res = await fetch(`${API_URL}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: name.trim(),
          category,
          price: Number(price),
          security_deposit: deposit ? Number(deposit) : 0,
          location: location.trim(),
          image: image.trim(),
          description: description.trim()
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to list item.");
      }

      onProductCreated(data.product);
      onClose();
    } catch (err) {
      console.warn("Backend offline, listing item in local demo mode:", err.message);
      const fallbackProduct = {
        id: Date.now(),
        name: name.trim(),
        description: description.trim() || "Owner verified peer rental item.",
        category,
        price: Number(price),
        security_deposit: deposit ? Number(deposit) : 0,
        location: location.trim(),
        image: image.trim(),
        available: true,
        rating: 5.0,
        reviews_count: 0,
        owner_id: user?.id || 1
      };
      onProductCreated(fallbackProduct);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="rent-modal list-item-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-modal" onClick={onClose} disabled={loading} aria-label="Close">
          ×
        </button>

        <div className="auth-heading">
          <h2>List Your Item for Rent</h2>
          <p>Earn steady income by renting your underused gadgets, gear, and tools.</p>
        </div>

        <form onSubmit={handleSubmit} className="list-item-form">
          <label htmlFor="item-title">Item Title *</label>
          <input
            id="item-title"
            type="text"
            placeholder="e.g. Sony A7 IV Camera or PlayStation 5"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div className="form-row">
            <div>
              <label htmlFor="item-category">Category *</label>
              <select
                id="item-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="select-input"
              >
                <option value="Cameras">Cameras & Drones</option>
                <option value="Gaming">Gaming & VR</option>
                <option value="Vehicles & Bikes">Vehicles & Bikes</option>
                <option value="Camping & Outdoors">Camping & Outdoors</option>
                <option value="Audio & Events">Audio & Events</option>
                <option value="Tools & DIY">Tools & DIY</option>
                <option value="Electronics">Electronics & Projectors</option>
              </select>
            </div>

            <div>
              <label htmlFor="item-price">Daily Rental Price (₹) *</label>
              <input
                id="item-price"
                type="number"
                min="1"
                placeholder="e.g. 799"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div>
              <label htmlFor="item-deposit">Refundable Deposit (₹)</label>
              <input
                id="item-deposit"
                type="number"
                min="0"
                placeholder="e.g. 2000"
                value={deposit}
                onChange={(e) => setDeposit(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="item-location">Pickup Location / City *</label>
              <input
                id="item-location"
                type="text"
                placeholder="e.g. Koramangala, Bangalore"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="item-image">Photo URL</label>
            <input
              id="item-image"
              type="url"
              placeholder="https://..."
              value={image}
              onChange={(e) => setImage(e.target.value)}
              required
            />

            <div className="preset-row">
              <span className="preset-label">Quick Presets:</span>
              <div className="preset-buttons">
                {IMAGE_PRESETS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    className={`preset-btn ${image === p.url ? "active" : ""}`}
                    onClick={() => setImage(p.url)}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {image && (
              <div className="image-preview">
                <img
                  src={image}
                  alt="Preview"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            )}
          </div>

          <label htmlFor="item-desc">Description & Rental Guidelines</label>
          <textarea
            id="item-desc"
            rows="3"
            placeholder="Include condition, accessories, and pickup instructions..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          {error && <p className="booking-error">{error}</p>}

          <button className="confirm-button" type="submit" disabled={loading}>
            {loading ? "Publishing Listing..." : "Publish Item for Rent 🚀"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ListItemModal;
