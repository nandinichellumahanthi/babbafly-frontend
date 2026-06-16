import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import "./SellerProfile.css";

function SellerProfile() {
  const { sellerId } = useParams();
  const [seller, setSeller] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [avgRating, setAvgRating] = useState(null);

  const API = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchSeller = async () => {
      try {
        // Fetch seller's listings (filter by userId on backend, or filter here)
        const res = await axios.get(`${API}/api/listings?seller=${sellerId}`);
        const allListings = Array.isArray(res.data) ? res.data : res.data.listings || [];

        // Get seller info from first listing's userId field
        const sellerListings = allListings.filter(
          (l) => l.userId?._id === sellerId || l.userId === sellerId
        );

        if (sellerListings.length > 0 && sellerListings[0].userId) {
          setSeller(sellerListings[0].userId);
        }

        setListings(sellerListings);

        // Fetch ratings for each listing and compute seller's average
        let totalRating = 0;
        let totalReviews = 0;
        for (const listing of sellerListings) {
          try {
            const r = await axios.get(`${API}/api/reviews/${listing._id}`);
            totalRating += parseFloat(r.data.average) * r.data.count;
            totalReviews += r.data.count;
          } catch {}
        }
        if (totalReviews > 0) {
          setAvgRating((totalRating / totalReviews).toFixed(1));
        }
      } catch (err) {
        console.error("Failed to fetch seller profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSeller();
  }, [sellerId]);

  const renderStars = (rating) => {
    return [1, 2, 3, 4, 5].map((s) => (
      <span key={s} className={s <= Math.round(rating) ? "star filled" : "star"}>★</span>
    ));
  };

  if (loading) return <div className="seller-loading">Loading seller profile...</div>;

  return (
    <div className="seller-profile-page">
      {/* Seller Card */}
      <div className="seller-card">
        <div className="seller-avatar-large">
          {seller?.name?.charAt(0)?.toUpperCase() || "?"}
        </div>
        <div className="seller-info">
          <h1>{seller?.name || "Seller"}</h1>
          <p className="seller-badge">✅ Verified Seller</p>
          {avgRating && (
            <div className="seller-rating">
              {renderStars(avgRating)}
              <span>{avgRating} avg rating</span>
            </div>
          )}
          <p className="seller-listing-count">{listings.length} active listing{listings.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Listings Grid */}
      <h2 className="seller-listings-title">Listings by this seller</h2>

      {listings.length === 0 ? (
        <p className="seller-no-listings">No active listings found.</p>
      ) : (
        <div className="seller-listings-grid">
          {listings.map((listing) => (
            <Link to={`/listing/${listing._id}`} key={listing._id} className="seller-listing-card">
              <div className="seller-listing-img-wrap">
                <img
                  src={listing.images?.[0] || listing.image || "/placeholder.png"}
                  alt={listing.title}
                  onError={(e) => (e.target.src = "/placeholder.png")}
                />
                {listing.sold && <span className="sold-ribbon">SOLD</span>}
              </div>
              <div className="seller-listing-info">
                <p className="seller-listing-title">{listing.title}</p>
                <p className="seller-listing-price">₹{listing.price?.toLocaleString()}</p>
                <p className="seller-listing-location">📍 {listing.location}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default SellerProfile;