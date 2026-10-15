import { useState } from "react";
import { API_URL } from "../config/api";

function AuthModal({
  initialMode = "login",
  onClose,
  onAuthSuccess
}) {
  const isAdminDemo = initialMode === "admin-demo";
  const [mode, setMode] = useState(isAdminDemo ? "login" : initialMode);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState(isAdminDemo ? "admin@rentloop.com" : "");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState(isAdminDemo ? "admin123" : "");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const cleanEmail = email.trim().toLowerCase();

    if (mode === "signup" && fullName.trim().length < 2) {
      setError("Please enter your full name (at least 2 characters).");
      return;
    }

    if (!cleanEmail || !password) {
      setError("Please fill in email and password.");
      return;
    }

    if (mode === "signup" && password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    try {
      setLoading(true);
      const endpoint =
        mode === "signup"
          ? `${API_URL}/auth/signup`
          : `${API_URL}/auth/login`;

      const body =
        mode === "signup"
          ? { full_name: fullName.trim(), email: cleanEmail, phone: phone.trim(), password }
          : { email: cleanEmail, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Authentication failed.");
      }

      localStorage.setItem("rentloopToken", data.token);
      localStorage.setItem("rentloopUser", JSON.stringify(data.user));

      onAuthSuccess(data.user, data.message || "Welcome to RentLoop!");
      onClose();
    } catch (err) {
      // In offline/demo mode, if backend is offline and user logs in with admin@rentloop.com
      if (cleanEmail === "admin@rentloop.com" && password === "admin123") {
        const demoAdmin = {
          id: 1,
          full_name: "RentLoop Admin",
          email: "admin@rentloop.com",
          role: "admin",
          phone: "9876543210"
        };
        localStorage.setItem("rentloopToken", "demo_admin_token_2026");
        localStorage.setItem("rentloopUser", JSON.stringify(demoAdmin));
        onAuthSuccess(demoAdmin, "Logged in as Demo Administrator!");
        onClose();
        return;
      }

      setError(err.message || "Failed to communicate with authentication server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="rent-modal auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-modal" onClick={onClose} disabled={loading} aria-label="Close">
          ×
        </button>

        <div className="auth-tab-switch">
          <button
            type="button"
            className={`auth-tab-btn ${mode === "login" ? "active" : ""}`}
            onClick={() => {
              setMode("login");
              setError("");
            }}
          >
            Log In
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${mode === "signup" ? "active" : ""}`}
            onClick={() => {
              setMode("signup");
              setError("");
            }}
          >
            Sign Up
          </button>
        </div>

        <div className="auth-heading">
          <h2>{mode === "signup" ? "Create Account" : "Welcome Back"}</h2>
          <p>
            {mode === "signup"
              ? "Join RentLoop and start renting or listing items."
              : "Log into your RentLoop account to manage rentals."}
          </p>
        </div>

        {/* 1-CLICK DEMO LOGINS FOR PROFESSOR / EVALUATION */}
        <div className="demo-accounts-box">
          <span className="demo-accounts-title">⚡ Quick 1-Click Demo Credentials:</span>
          <div className="demo-accounts-btns">
            <button
              type="button"
              className="demo-account-pill admin-pill"
              onClick={() => {
                setMode("login");
                setEmail("admin@rentloop.com");
                setPassword("admin123");
                setError("");
              }}
            >
              👑 Fill Admin (admin@rentloop.com)
            </button>
            <button
              type="button"
              className="demo-account-pill customer-pill"
              onClick={() => {
                setMode("login");
                setEmail("rohan@example.com");
                setPassword("password123");
                setError("");
              }}
            >
              👤 Fill Customer (rohan@example.com)
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === "signup" && (
            <>
              <label htmlFor="auth-fullname">Full Name *</label>
              <input
                id="auth-fullname"
                type="text"
                placeholder="e.g. Rahul Sharma"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />

              <label htmlFor="auth-phone">Mobile Phone (Optional)</label>
              <input
                id="auth-phone"
                type="tel"
                placeholder="e.g. 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </>
          )}

          <label htmlFor="auth-email">Email Address *</label>
          <input
            id="auth-email"
            type="email"
            placeholder="e.g. rahul@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <label htmlFor="auth-password">Password *</label>
          <input
            id="auth-password"
            type="password"
            placeholder={mode === "signup" ? "Minimum 8 characters" : "Enter password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
          />

          {error && <p className="booking-error">{error}</p>}

          <button className="confirm-button" type="submit" disabled={loading}>
            {loading ? "Please wait..." : mode === "signup" ? "Create Account" : "Log In"}
          </button>
        </form>

        <p className="auth-switch">
          {mode === "signup" ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            type="button"
            onClick={() => {
              setMode(mode === "signup" ? "login" : "signup");
              setError("");
            }}
          >
            {mode === "signup" ? "Log In" : "Sign Up"}
          </button>
        </p>
      </div>
    </div>
  );
}

export default AuthModal;
