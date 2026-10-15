function Hero({ search, setSearch, onSearchSubmit, onQuickCategory }) {
  const quickSearches = ["Cameras", "PlayStation", "Camping Tent", "Bikes", "Projector"];

  return (
    <section className="hero" id="home">
      <div className="hero-content">
        <div className="hero-badge">⚡ India's Smart Peer-to-Peer Rental Community</div>
        <h1>
          Rent what you need.
          <br />
          <span>Share what you have.</span>
        </h1>

        <p>
          RentLoop connects you with trusted neighbours to rent high-value cameras,
          gaming consoles, camping gear, bikes, and tools at a fraction of the cost.
        </p>

        <form
          className="search-box"
          onSubmit={(e) => {
            e.preventDefault();
            onSearchSubmit();
          }}
        >
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search Sony cameras, PS5, camping tents, Trek bikes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className="search-clear"
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
          <button type="submit">Search</button>
        </form>

        <div className="quick-search-tags">
          <span>Popular:</span>
          {quickSearches.map((item) => (
            <button
              key={item}
              type="button"
              className="quick-tag"
              onClick={() => {
                if (onQuickCategory) {
                  onQuickCategory(item);
                } else {
                  setSearch(item);
                  onSearchSubmit();
                }
              }}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="quick-neighborhood-tags">
          <span>📍 Neighborhoods:</span>
          {["Indiranagar", "Koramangala", "HSR Layout", "Whitefield", "Jayanagar"].map((loc) => (
            <button
              key={loc}
              type="button"
              className="quick-loc-tag"
              onClick={() => {
                setSearch(loc);
                onSearchSubmit();
              }}
            >
              {loc}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Hero;
