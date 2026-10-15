import { useEffect } from "react";

function Toast({ message, type = "success", onClose, duration = 4000 }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const icons = {
    success: "✓",
    error: "✕",
    info: "ℹ"
  };

  return (
    <div className={`toast-container toast-${type}`}>
      <span className="toast-icon">{icons[type] || "ℹ"}</span>
      <span className="toast-text">{message}</span>
      <button className="toast-close" onClick={onClose} aria-label="Close">
        ×
      </button>
    </div>
  );
}

export default Toast;
