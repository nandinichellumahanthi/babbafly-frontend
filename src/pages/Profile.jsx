import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import API from "../services/api";

function Profile() {
  const [user, setUser] = useState(null);
  const [listings, setListings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [previewItem, setPreviewItem] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (!savedUser) {
      navigate("/login");
      return;
    }
    const parsedUser = JSON.parse(savedUser);
setUser(parsedUser);
const key = `wishlist_${parsedUser._id || parsedUser.id || "guest"}`;
fetchUserListings(parsedUser._id);
fetchUserOrders(parsedUser._id);
loadWishlist(key);
  }, []);

  const fetchUserListings = async (userId) => {
    try {
      const res = await API.get("/listings");
      const userListings = res.data.filter(
        (item) => item.userId === userId || item.user === userId
      );
      setListings(userListings);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchUserOrders = async (userId) => {
    try {
      const res = await API.get(`/orders/user/${userId}`);
      setOrders(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const loadWishlist = (key) => {
  try {
    const resolvedKey = key || `wishlist_${user?._id || user?.id || "guest"}`;
    const saved = localStorage.getItem(resolvedKey);
    if (saved) setWishlist(JSON.parse(saved));
    else setWishlist([]);
  } catch (err) {
    console.log(err);
  }
};

  const removeFromWishlist = (itemId) => {
  const wishlistKey = `wishlist_${user?._id || user?.id || "guest"}`;
  const updated = wishlist.filter((i) => i._id !== itemId);
  setWishlist(updated);
  localStorage.setItem(wishlistKey, JSON.stringify(updated));
  if (previewItem?._id === itemId) setPreviewItem(null);
};

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userId");
    navigate("/login");
  };

  if (!user) return null;

  const totalSpent = orders.reduce((sum, o) => sum + (o.amount || 0), 0);

  return (
    <>
      <Navbar />

      <div className="profile-page">

        {/* Profile Card */}
        <div className="profile-card">
          <div className="profile-avatar">
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <h2>{user.name}</h2>
          <p>{user.email}</p>
          {user.phone && <p>📞 {user.phone}</p>}
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>

        {/* Dashboard Tabs */}
        <div className="dashboard">

          <div className="dashboard-tabs">
            <button
              className={activeTab === "dashboard" ? "tab active-tab" : "tab"}
              onClick={() => setActiveTab("dashboard")}
            >
              📊 Dashboard
            </button>
            <button
              className={activeTab === "listings" ? "tab active-tab" : "tab"}
              onClick={() => setActiveTab("listings")}
            >
              📦 My Listings
            </button>
            <button
              className={activeTab === "orders" ? "tab active-tab" : "tab"}
              onClick={() => setActiveTab("orders")}
            >
              🛒 My Orders
            </button>
            <button
              className={activeTab === "wishlist" ? "tab active-tab" : "tab"}
              onClick={() => { setActiveTab("wishlist"); loadWishlist(); }}
            >
              ❤️ Wishlist {wishlist.length > 0 && <span className="tab-badge">{wishlist.length}</span>}
            </button>
          </div>

          {/* DASHBOARD TAB */}
          {activeTab === "dashboard" && (
            <div className="dashboard-content">
              <div className="stats-grid">
                <div className="stat-card">
                  <span className="stat-icon">📦</span>
                  <h3>{listings.length}</h3>
                  <p>Total Listings</p>
                </div>
                <div className="stat-card">
                  <span className="stat-icon">🛒</span>
                  <h3>{orders.length}</h3>
                  <p>Total Orders</p>
                </div>
                <div className="stat-card">
                  <span className="stat-icon">💰</span>
                  <h3>₹{totalSpent.toLocaleString()}</h3>
                  <p>Total Spent</p>
                </div>
                <div className="stat-card">
                  <span className="stat-icon">❤️</span>
                  <h3>{wishlist.length}</h3>
                  <p>Wishlisted</p>
                </div>
              </div>

              <div className="recent-section">
                <h3>🕐 Recent Orders</h3>
                {orders.length > 0 ? (
                  <table className="orders-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.slice(0, 5).map((order) => (
                        <tr key={order._id}>
                          <td>#{order._id.slice(-6).toUpperCase()}</td>
                          <td>₹{order.amount?.toLocaleString()}</td>
                          <td>
                            <span className={`status-badge status-${order.status || "pending"}`}>
                              {order.status || "Pending"}
                            </span>
                          </td>
                          <td>
                            {order.createdAt
                              ? new Date(order.createdAt).toLocaleDateString("en-IN")
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="no-listings">No orders yet.</p>
                )}
              </div>
            </div>
          )}

          {/* LISTINGS TAB */}
          {activeTab === "listings" && (
            <div className="profile-listings">
              <h3>My Listings ({listings.length})</h3>
              {listings.length > 0 ? (
                <div className="listing-grid">
                  {listings.map((item) => (
                    <div
                      key={item._id}
                      className="listing-card"
                      onClick={() => navigate(`/listing/${item._id}`)}
                    >
                      <img
                        src={item.images?.[0] || "https://via.placeholder.com/400"}
                        alt={item.title}
                      />
                      <div className="listing-content">
                        <h3>{item.title}</h3>
                        <p>📂 {item.category}</p>
                        <p>📍 {item.location}</p>
                        <h2>₹{item.price?.toLocaleString()}</h2>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-listings">You have not added any listings yet.</p>
              )}
            </div>
          )}

          {/* ORDERS TAB */}
          {activeTab === "orders" && (
            <div className="profile-listings">
              <h3>My Orders ({orders.length})</h3>
              {orders.length > 0 ? (
                <table className="orders-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order._id}>
                        <td>#{order._id.slice(-6).toUpperCase()}</td>
                        <td>₹{order.amount?.toLocaleString()}</td>
                        <td>
                          <span className={`status-badge status-${order.status || "pending"}`}>
                            {order.status || "Pending"}
                          </span>
                        </td>
                        <td>
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleDateString("en-IN")
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="no-listings">No orders placed yet.</p>
              )}
            </div>
          )}

          {/* WISHLIST TAB */}
          {activeTab === "wishlist" && (
            <div className="wishlist-tab">
              <h3>My Wishlist ({wishlist.length})</h3>

              {wishlist.length > 0 ? (
                <div className="wishlist-grid">
                  {wishlist.map((item) => (
                    <div
                      key={item._id}
                      className="wishlist-card"
                      onClick={() => setPreviewItem(item)}
                    >
                      <img
                        src={item.images?.[0] || "https://via.placeholder.com/300"}
                        alt={item.title}
                      />
                      <div className="wishlist-card-info">
                        <p className="wl-title">{item.title}</p>
                        <p className="wl-price">₹{item.price?.toLocaleString()}</p>
                        <p className="wl-location">📍 {item.location}</p>
                      </div>
                      <button
                        className="wl-remove"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromWishlist(item._id);
                        }}
                        title="Remove from wishlist"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="wishlist-empty">
                  <p>🤍 Your wishlist is empty.</p>
                  <button className="primary-btn" onClick={() => navigate("/listings")}>
                    Browse Listings
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Preview Popup */}
      {previewItem && (
        <div className="preview-overlay" onClick={() => setPreviewItem(null)}>
          <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
            <button className="preview-close" onClick={() => setPreviewItem(null)}>✕</button>
            <img
              src={previewItem.images?.[0] || "https://via.placeholder.com/400"}
              alt={previewItem.title}
              className="preview-img"
            />
            <div className="preview-info">
              <h2>{previewItem.title}</h2>
              <p className="preview-price">₹{previewItem.price?.toLocaleString()}</p>
              <p className="preview-location">📍 {previewItem.location}</p>
              <div className="preview-actions">
                <button
                  className="buy-now-btn"
                  onClick={() => navigate(`/listing/${previewItem._id}`)}
                >
                  View Full Listing
                </button>
                <button
                  className="wl-remove-btn"
                  onClick={() => removeFromWishlist(previewItem._id)}
                >
                  Remove from Wishlist
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}

export default Profile;