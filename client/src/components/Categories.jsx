const categoryIcons = {
  All: "🌟",
  Electronics: "💻",
  "Cameras & Photography": "📷",
  Cameras: "📷",
  Gaming: "🎮",
  "Audio Equipment": "🔊",
  "Audio & Events": "🔊",
  Projectors: "📽️",
  Transportation: "🛴",
  "Vehicles & Bikes": "🚲",
  "Outdoor & Camping": "⛺",
  "Camping & Outdoors": "⛺",
  "Tools & Equipment": "🛠️",
  "Tools & DIY": "🛠️",
  Furniture: "🪑",
  "Home Appliances": "🏠",
  "Event Equipment": "🎉"
};

function Categories({ categories, selectedCategory, onSelectCategory }) {
  return (
    <section className="categories">
      <div className="categories-header">
        <h2>Explore By Category</h2>
        <p>Pick a category to find rental products in Bangalore and across India</p>
      </div>

      <div className="category-buttons">
        {categories.map((cat) => {
          const icon = categoryIcons[cat] || "📦";
          const isActive = selectedCategory === cat;

          return (
            <button
              key={cat}
              className={`category-button ${isActive ? "active" : ""}`}
              onClick={() => onSelectCategory(cat)}
            >
              <span className="cat-icon">{icon}</span>
              <span>{cat}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default Categories;
