import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import API from "../services/api";
mport { useScrollReveal } from "../Hooks/useScrollReveal";

const TICKER_ITEMS = [
  "iPhone 14 · ₹67,000 · Vijayawada",
  "MacBook Air M2 · ₹85,000 · Hyderabad",
  "Boat Rockerz 550 · ₹1,800 · Vizag",
  "Samsung S24 · ₹65,000 · Guntur",
  "Dell Inspiron 15 · ₹65,000 · Chennai",
  "Canon EOS 1500D · ₹42,000 · Vijayawada",
];

function Home() {
  const [stats, setStats] = useState({ listings: 0, categories: 0 });
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [featured, setFeatured] = useState([]);

  const searchRef = useRef(null);
  const navigate = useNavigate();

  const [featuredRef, featuredVisible] = useScrollReveal();
  const [statsRevealRef, statsVisible] = useScrollReveal();

  useEffect(() => {
    fetchStats();
    fetchFeatured();
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        const res = await API.get("/listings");
        const filtered = res.data
          .filter((item) =>
            item.title?.toLowerCase().includes(search.toLowerCase())
          )
          .slice(0, 8);
        setSuggestions(filtered);
        setShowSuggestions(true);
        setActiveIndex(-1);
      } catch {}
    }, 250);
    return () => clearTimeout(timeout);
  }, [search]);

  const fetchStats = async () => {
    try {
      const res = await API.get("/stats");
      setStats(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchFeatured = async () => {
    try {
      const res = await API.get("/listings");
      const sorted = [...res.data]
        .filter((item) => !item.sold)
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 4);
      setFeatured(sorted);
    } catch (err) {
      console.log(err);
    }
  };

  const handleSearch = (query = search) => {
    const q = query.trim();
    setShowSuggestions(false);
    if (q) {
      navigate(`/listings?search=${encodeURIComponent(q)}`);
    } else {
      navigate("/listings");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      setActiveIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      setActiveIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        navigate(`/listing/${suggestions[activeIndex]._id}`);
        setShowSuggestions(false);
      } else {
        handleSearch();
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  return (
    <>
      <Navbar />

      {/* HERO */}
      <section className="hero">
        <div className="hero-grid-bg" />
        <div className="blob blob-1" />
<div className="blob blob-2" />
<div className="blob blob-3" />
<div className="blob blob-4" />
{/* Floating bubbles + emoji floaters */}
<div className="bubbles-wrap">
  {[...Array(14)].map((_, i) => {
    const emojis = ["📱","💻","🎮","📸","🎧","⌨️","🖥️","📺"];
    const isEmoji = i % 4 === 0;
    return isEmoji ? (
      <div className="bubble bubble-emoji" key={i} style={{
        left: `${Math.floor((i * 43 + 7) % 95)}%`,
        fontSize: `${12 + (i % 3) * 4}px`,
        animationDelay: `${(i * 1.7) % 10}s`,
        animationDuration: `${14 + (i % 4) * 3}s`
      }}>
        {emojis[i % emojis.length]}
      </div>
    ) : (
      <div className="bubble" key={i} style={{
        left: `${Math.floor((i * 37 + 11) % 100)}%`,
        width: `${5 + (i % 4) * 3}px`,
        height: `${5 + (i % 4) * 3}px`,
        animationDelay: `${(i * 1.3) % 8}s`,
        animationDuration: `${10 + (i % 5) * 2}s`
      }} />
    );
  })}
</div>
        <div className="hero-inner">
          <div className="hero-eyebrow">
            <span className="hero-dot" />
            LIVE MARKETPLACE · {stats.listings || "—"} LISTED RIGHT NOW
          </div>

          <h1 className="hero-headline">Buy &amp; sell electronics</h1>
          <h1 className="hero-headline">The smart way🎧</h1>
          <p className="hero-sub">
            Verified sellers, real listings, direct contact. No middleman markup.
          </p>

          <div className="search-box" ref={searchRef}>
            <span className="search-icon">⌕</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder="Search iPhone, MacBook, PS5..."
              autoComplete="off"
            />
            <button onClick={() => handleSearch()}>Search</button>

            {showSuggestions && suggestions.length > 0 && (
              <div className="hero-suggestions">
                {suggestions.map((item, idx) => (
                  <div
                    key={item._id}
                    className={`hero-suggestion-item ${idx === activeIndex ? "hero-sugg-active" : ""}`}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onMouseLeave={() => setActiveIndex(-1)}
                    onClick={() => {
                      navigate(`/listing/${item._id}`);
                      setShowSuggestions(false);
                    }}
                  >
                    <span className="hero-sugg-icon">⌕</span>
                    <span className="hero-sugg-text">{item.title}</span>
                    <span className="hero-sugg-price">₹{item.price?.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="hero-buttons">
            <button className="primary-btn" onClick={() => navigate("/listings")}>
              Explore listings
            </button>
            <button className="secondary-btn" onClick={() => navigate("/categories")}>
              Browse categories
            </button>
          </div>
        </div>

      </section>

      {/* STATS */}
      <section
        className={`stats reveal-section ${statsVisible ? "reveal-visible" : ""}`}
        ref={statsRevealRef}
      >
        <div className="stat-card">
          <h2>{stats.listings}</h2>
          <p>Listings</p>
        </div>
        <div className="stat-card">
          <h2>{stats.categories}</h2>
          <p>Categories</p>
        </div>
        <div className="stat-card">
          <h2>24/7</h2>
          <p>Marketplace</p>
        </div>
      </section>

      {/* FEATURED LISTINGS */}
     <section
  className={`featured-section reveal-section ${featuredVisible ? "reveal-visible" : ""}`}
  ref={featuredRef}
>
  <div className="section-heading">
    <h2>Featured listings</h2>
    <p>Top picks from our marketplace, handpicked for you</p>
  </div>

  {featured.length > 0 ? (
    <>
      <div className="featured-grid">
        {featured.map((item, idx) => (
          <div
            key={item._id}
            className="featured-card"
            style={{ animationDelay: `${idx * 0.1}s` }}
            onClick={() => navigate(`/listing/${item._id}`)}
          >
            <div className="featured-img-wrap">
              <img
                src={item.images?.[0] || "https://via.placeholder.com/400"}
                alt={item.title}
              />
              <span className="featured-tag">Featured</span>
            </div>
            <div className="featured-info">
              <h3>{item.title}</h3>
              <p className="featured-location">📍 {item.location}</p>
              <p className="featured-price">₹{item.price?.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
      <button className="view-all-btn" onClick={() => navigate("/listings")}>
        View all listings →
      </button>
    </>
  ) : (
    <div className="featured-empty">
      <p>🛒 Listings will appear here once sellers start posting!</p>
      <button className="view-all-btn" onClick={() => navigate("/listings")}>
        Browse listings →
      </button>
    </div>
  )}
</section>
      <Footer />
    </>
  );
}

export default Home;