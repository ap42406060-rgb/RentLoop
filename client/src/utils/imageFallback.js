// Generates crisp, lightweight SVG placeholder images if external photos fail to load or offline
const categoryIcons = {
  Electronics: { icon: "💻", title: "Electronics", color1: "#3b82f6", color2: "#1d4ed8" },
  "Cameras & Photography": { icon: "📷", title: "Cameras & Photography", color1: "#10b981", color2: "#047857" },
  Cameras: { icon: "📷", title: "Cameras & Drones", color1: "#10b981", color2: "#047857" },
  Gaming: { icon: "🎮", title: "Gaming & VR", color1: "#8b5cf6", color2: "#6d28d9" },
  "Audio Equipment": { icon: "🔊", title: "Audio Equipment", color1: "#f59e0b", color2: "#b45309" },
  "Audio & Events": { icon: "🔊", title: "Audio Equipment", color1: "#f59e0b", color2: "#b45309" },
  Projectors: { icon: "📽️", title: "Projectors", color1: "#6366f1", color2: "#4338ca" },
  Transportation: { icon: "🛴", title: "Transportation", color1: "#06b6d4", color2: "#0e7490" },
  "Vehicles & Bikes": { icon: "🚲", title: "Transportation", color1: "#06b6d4", color2: "#0e7490" },
  "Outdoor & Camping": { icon: "⛺", title: "Outdoor & Camping", color1: "#84cc16", color2: "#4d7c0f" },
  "Camping & Outdoors": { icon: "⛺", title: "Outdoor & Camping", color1: "#84cc16", color2: "#4d7c0f" },
  "Tools & Equipment": { icon: "🛠️", title: "Tools & Equipment", color1: "#64748b", color2: "#334155" },
  "Tools & DIY": { icon: "🛠️", title: "Tools & Equipment", color1: "#64748b", color2: "#334155" },
  Furniture: { icon: "🪑", title: "Furniture & Workspaces", color1: "#d97706", color2: "#92400e" },
  "Home Appliances": { icon: "🏠", title: "Home Appliances", color1: "#0ea5e9", color2: "#0369a1" },
  "Event Equipment": { icon: "🎉", title: "Event & Party Equipment", color1: "#ec4899", color2: "#be185d" }
};

export function getFallbackImage(category = "General", productName = "") {
  const meta = categoryIcons[category] || {
    icon: "📦",
    title: category || "Rental Item",
    color1: "#198754",
    color2: "#14532d"
  };

  const label = productName ? productName.slice(0, 24) : meta.title;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${meta.color1}" />
        <stop offset="100%" stop-color="${meta.color2}" />
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#grad)" />
    <circle cx="400" cy="200" r="85" fill="#ffffff" fill-opacity="0.18" />
    <text x="400" y="225" font-size="72" text-anchor="middle" font-family="-apple-system, system-ui, sans-serif">${meta.icon}</text>
    <text x="400" y="340" font-size="28" font-weight="700" fill="#ffffff" text-anchor="middle" font-family="-apple-system, system-ui, sans-serif">${label}</text>
    <text x="400" y="380" font-size="18" fill="#e2e8f0" text-anchor="middle" font-family="-apple-system, system-ui, sans-serif">RentLoop Verified</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
