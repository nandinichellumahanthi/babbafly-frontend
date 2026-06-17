import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import Reviews from "../components/Reviews";
import API from "../services/api";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

function ListingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [listing, setListing] = useState(null);
  const [activeImg, setActiveImg] = useState(0);
  const [ordering, setOrdering] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistMsg, setWishlistMsg] = useState("");
  const [showContact, setShowContact] = useState(false);
  const [startingChat, setStartingChat] = useState(false);

  const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
  })();
  const token = localStorage.getItem("token");
  
const wishlistKey = `wishlist_${currentUser?._id || currentUser?.id || "guest"}`;
  useEffect(() => {
    fetchListing();
    checkWishlist();
  }, [id]);

  const fetchListing = async () => {
    try {
      const res = await API.get(`/listings/${id}`);
      setListing(res.data);
      setActiveImg(0);
      saveToRecentlyViewed(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const saveToRecentlyViewed = (item) => {
    try {
      const saved = localStorage.getItem("recentlyViewed");
      let list = saved ? JSON.parse(saved) : [];
      list = list.filter((i) => i._id !== item._id);
      list.unshift({
        _id: item._id,
        title: item.title,
        price: item.price,
        images: item.images,
        location: item.location,
      });
      list = list.slice(0, 6);
      localStorage.setItem("recentlyViewed", JSON.stringify(list));
    } catch (err) {}
  };

  const checkWishlist = () => {
    try {
      const saved = localStorage.getItem(wishlistKey);
      const list = saved ? JSON.parse(saved) : [];
      setWishlisted(list.some((i) => i._id === id));
    } catch (err) {}
  };

  const handleWishlist = () => {
    if (!token) { navigate("/login", { state: { from: `/listing/${id}` } }); return; }
    try {
      const saved = localStorage.getItem(wishlistKey);
      let list = saved ? JSON.parse(saved) : [];
      if (wishlisted) {
        list = list.filter((i) => i._id !== id);
        setWishlisted(false);
        setWishlistMsg("Removed from wishlist");
      } else {
        list.unshift({
          _id: listing._id,
          title: listing.title,
          price: listing.price,
          images: listing.images,
          location: listing.location,
        });
        setWishlisted(true);
        setWishlistMsg("Added to wishlist ❤️");
      }
      localStorage.setItem(wishlistKey, JSON.stringify(list));
      setTimeout(() => setWishlistMsg(""), 2000);
    } catch (err) {}
  };
const handleBuyNow = async () => {
  if (!token) {
    navigate("/login", {
      state: { from: `/listing/${id}` }
    });

    return;
  }

  setOrdering(true);

  setOrderError("");

  try {

    await API.post("/orders", {
      listingId: id,
      amount: listing.price,
      userId: currentUser?._id || currentUser?.id,
    });

    setOrderSuccess(true);
setTimeout(() => {
  setOrderSuccess(false);
}, 3000);
  } catch (err) {

    setOrderError(
      err.response?.data?.message ||
      "Something went wrong. Please try again."
    );

  } finally {

    setOrdering(false);

  }
};
  // ── Start or open a chat with the seller ──
  const handleMessageSeller = async () => {
    if (!token) { navigate("/login", { state: { from: `/listing/${id}` } }); return; }

    const sellerId = listing?.userId?._id || listing?.userId;
    if (!sellerId) {
      alert("Seller info not available yet. Please try again.");
      return;
    }

    setStartingChat(true);
    try {
      const res = await axios.post(
        `${BASE}/api/chat/conversations`,
        { listingId: listing._id, sellerId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigate(`/chat/${res.data._id}`);
    } catch (err) {
      console.error("Chat start failed:", err.response?.data || err.message);
      alert("Could not start chat. Please try again.");
    } finally {
      setStartingChat(false);
    }
  };

  const handleWhatsApp = () => {
    const phone = listing?.userId?.phone;
    if (!phone) return;
    const msg = encodeURIComponent(
      `Hi! I'm interested in your listing: ${listing.title} (₹${listing.price})`
    );
    window.open(`https://wa.me/91${phone}?text=${msg}`, "_blank");
  };

  const handleCall = () => {
    const phone = listing?.userId?.phone;
    if (phone) window.open(`tel:${phone}`);
  };

  const handleEmail = () => {
    const email = listing?.userId?.email;
    if (!email) return;
    const subject = encodeURIComponent(`Interested in: ${listing.title}`);
    const body = encodeURIComponent(
      `Hi,\n\nI'm interested in your listing "${listing.title}" priced at ₹${listing.price}.\n\nPlease get in touch!\n\nThank you.`
    );
    window.open(`mailto:${email}?subject=${subject}&body=${body}`);
  };

  const myId = currentUser?._id || currentUser?.id;
  const sellerId = listing?.userId?._id || listing?.userId;
  const isOwner = myId && sellerId && myId === sellerId;

  if (!listing) {
    return (
      <>
        <Navbar />
        <div style={{ textAlign: "center", marginTop: "140px", color: "#888" }}>
          Loading listing...
        </div>
      </>
    );
  }

  const images = listing.images?.length ? listing.images : ["https://via.placeholder.com/500"];
  const seller = listing.userId;

  // Show seller name — handle both populated object and raw string
  const sellerName = typeof seller === "object" ? seller?.name : null;
  const hasSellerInfo = typeof seller === "object" && seller !== null;

  return (
    <>
      <Navbar />

      <div className="details-page">
        {/* Image Gallery */}
        <div className="gallery-wrap">
          <div className="gallery-main">
  {listing.sold && (
    <div className="sold-badge-overlay"></div>
  )}

  <img
    src={images[activeImg]}
              alt={listing.title}
              className="gallery-main-img"
              onError={(e) => (e.target.src = "https://via.placeholder.com/500")}
            />
          </div>
          {images.length > 1 && (
            <div className="gallery-thumbs">
              {images.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={`thumb-${i}`}
                  className={`gallery-thumb ${activeImg === i ? "active-thumb" : ""}`}
                  onClick={() => setActiveImg(i)}
                  onError={(e) => (e.target.src = "https://via.placeholder.com/80")}
                />
              ))}
            </div>
          )}
        </div>

        <div className="details-info">
          <div className="details-title-row">
            <h1>{listing.title}</h1>
            {listing.sold && <span className="sold-badge">SOLD</span>}
          </div>

          <h2 className="details-price">₹{listing.price?.toLocaleString()}</h2>
          <p className="details-desc">{listing.description}</p>
          <p className="details-location">📍 {listing.location}</p>
          <p className="details-category">📂 {listing.category}</p>

          {/* Owner actions */}
          {isOwner && (
            <div className="owner-actions">
              <button className="edit-btn" onClick={() => navigate(`/edit-listing/${id}`)}>
                ✏️ Edit Listing
              </button>
            </div>
          )}

          {/* Buy / Wishlist / Message */}
         <div className="details-actions">
  {!isOwner && (
    <>
      <button
        onClick={handleBuyNow}
        disabled={ordering}
        className="buy-now-btn"
      >
        {ordering ? "Placing Order..." : "🛒 Buy Now"}
      </button>

      <button
        onClick={handleMessageSeller}
        disabled={startingChat}
        className="message-seller-btn"
      >
        {startingChat ? "Opening Chat..." : "💬 Message Seller"}
      </button>
    </>
  )}

  <button
    onClick={handleWishlist}
    className={`wishlist-btn ${wishlisted ? "wishlisted" : ""}`}
  >
    {wishlisted ? "❤️ Wishlisted" : "🤍 Wishlist"}
  </button>

  {orderSuccess && (
    <p className="order-success">
      ✅ Added to Orders Successfully
    </p>
  )}

  {orderError && (
    <p className="order-error">
      {orderError}
    </p>
  )}

  {wishlistMsg && (
    <p className="wishlist-msg">
      {wishlistMsg}
    </p>
  )}
</div>

          {/* ── Seller Section ── */}
          {!isOwner && (
            <div className="seller-section">
              <div className="seller-header" onClick={() => setShowContact(!showContact)}>
                <div className="seller-avatar">
                  {sellerName?.[0]?.toUpperCase() || "S"}
                </div>
                <div className="seller-meta">
                  {hasSellerInfo ? (
                    <>
                      <p className="seller-name">
                        <Link
                          to={`/seller/${seller._id}`}
                          className="seller-profile-link"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {sellerName}
                        </Link>
                      </p>
                      <p className="seller-label">✅ Verified Seller</p>
                    </>
                  ) : (
                    <>
                      <p className="seller-name">Seller</p>
                      <p className="seller-label no-info">
                        ⚠️ Add .populate("userId") to backend to show seller info
                      </p>
                    </>
                  )}
                </div>
                <span className="contact-toggle">{showContact ? "▲ Hide" : "▼ Contact"}</span>
              </div>

              {showContact && (
                <div className="contact-options">
                  {hasSellerInfo && seller?.phone ? (
                    <>
                      <button className="contact-btn whatsapp-btn" onClick={handleWhatsApp}>
                        💬 WhatsApp
                      </button>
                      <button className="contact-btn call-btn" onClick={handleCall}>
                        📞 Call
                      </button>
                    </>
                  ) : null}
                  {hasSellerInfo && seller?.email ? (
                    <button className="contact-btn email-btn" onClick={handleEmail}>
                      ✉️ Email
                    </button>
                  ) : null}
                  {!hasSellerInfo || (!seller?.phone && !seller?.email) ? (
                    <p className="no-contact">
                      No contact info available. Use the Message Seller button above to chat.
                    </p>
                  ) : null}
                </div>
              )}
            </div>
          )}

          {/* Reviews */}
          <Reviews listingId={listing._id} />
        </div>
      </div>
    </>
  );
}

export default ListingDetails;