import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import API from "../services/api";

const CATEGORIES = ["Mobiles", "Laptops", "Tablet", "Accessories"];

function Listings() {
  const [listings, setListings] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortBy, setSortBy] = useState("");

  const location = useLocation();
  const navigate = useNavigate();

  const search =
  new URLSearchParams(location.search).get("search") || "";
  const categoryFromUrl = new URLSearchParams(location.search).get("category") || "";

  useEffect(() => {
    if (categoryFromUrl) setSelectedCategory(categoryFromUrl);
  }, [categoryFromUrl]);

  useEffect(() => {
  fetchListings();
}, [search]);

  const fetchListings = async () => {
    try {
      const res = await API.get("/listings");
      setListings(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const deleteListing = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("Delete this listing?")) return;
    try {
      await API.delete(`/listings/${id}`);
      setListings((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      console.log(err);
    }
  };

  const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
  })();

  // Apply filters and sort
  const filtered = listings
    .filter((item) => {
      const matchesSearch = search
        ? item.title?.toLowerCase().includes(search.toLowerCase())
        : true;
      const matchesCategory = selectedCategory
  ? item.category?.toLowerCase().replace(/s$/, "") === selectedCategory.toLowerCase().replace(/s$/, "")
  : true;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === "lowToHigh") return a.price - b.price;
      if (sortBy === "highToLow") return b.price - a.price;
      return 0;
    });

  return (
    <>
      <Navbar />

      <div className="listings-page">
        <h1>Featured Listings</h1>

        {/* Category Pills */}
        <div className="category-pills">
          <button
            className={`pill ${selectedCategory === "" ? "pill-active" : ""}`}
            onClick={() => setSelectedCategory("")}
          >
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`pill ${selectedCategory === cat ? "pill-active" : ""}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Sort + result count */}
        <div className="filter-section">
          <p className="result-count">{filtered.length} listing{filtered.length !== 1 ? "s" : ""} found</p>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="">Sort By</option>
            <option value="lowToHigh">Price: Low to High</option>
            <option value="highToLow">Price: High to Low</option>
          </select>
        </div>

        {search && (
          <p className="search-label">Search results for: <b>"{search}"</b></p>
        )}

        <div className="listing-grid">
          {filtered.length > 0 ? (
            filtered.map((item) => {
              const isOwner = currentUser &&
                (item.userId === currentUser._id || item.userId?._id === currentUser._id);

              return (
                <div key={item._id} className={`listing-card ${item.sold ? "listing-sold" : ""}`}>
                  <div className="listing-img-wrap">
                    <img
                      src={item.images?.[0] || "https://via.placeholder.com/400"}
                      alt={item.title}
                    />
                    {item.sold && <div className="sold-ribbon">SOLD</div>}
                  </div>
                  <div className="listing-content">
                    <h3>{item.title}</h3>
                    <p>📂 {item.category || "Uncategorized"}</p>
                    <p>📍 {item.location}</p>
                    <h2>₹{item.price?.toLocaleString()}</h2>
                    <div className="card-buttons">
                      <Link to={`/listing/${item._id}`}>
                        <button className="view-btn">View Details</button>
                      </Link>
                      {isOwner && (
                        <>
                          <button
                            className="edit-btn-sm"
                            onClick={(e) => {
                              e.preventDefault();
                              navigate(`/edit-listing/${item._id}`);
                            }}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            className="delete-btn"
                            onClick={(e) => deleteListing(e, item._id)}
                          >
                            🗑️ Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="no-results">
              <p>No listings found{selectedCategory ? ` in "${selectedCategory}"` : ""}.</p>
              {selectedCategory && (
                <button className="pill pill-active" onClick={() => setSelectedCategory("")}>
                  Clear filter
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
}

export default Listings;