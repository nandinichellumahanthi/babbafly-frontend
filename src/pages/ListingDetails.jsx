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


          {/* Buy / Wishlist / Message */}
          <div className="details-actions">
            {listing.sold ? (
              <div className="sold-notice">🚫 This item has been sold.</div>
            ) : orderSuccess ? (
              <div className="order-success">✅ Order placed! We'll contact you shortly.</div>
            ) : (
              <>
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
                {orderError && <p className="order-error">{orderError}</p>}
                {wishlistMsg && <p className="wishlist-msg">{wishlistMsg}</p>}
              </>
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