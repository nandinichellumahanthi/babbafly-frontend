import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./Navbar.css";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path) =>
    location.pathname === path ? "active-link" : "";

  const user = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user"))
    : null;

  const token = localStorage.getItem("token");

  // Close drawer on route change (user tapped a link)
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Fetch notifications
  useEffect(() => {
    if (!user || !token) return;
    const fetchNotifications = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/notifications`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      } catch {}
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  // Close notification dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleBellClick = async () => {
    setShowDropdown((prev) => !prev);
    if (!showDropdown && unreadCount > 0 && token) {
      try {
        await axios.patch(
          `${import.meta.env.VITE_API_URL}/api/notifications/read-all`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setUnreadCount(0);
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      } catch {}
    }
  };

  const handleNotificationClick = (notif) => {
    setShowDropdown(false);
    if (notif.link) navigate(notif.link);
  };

  const handleDeleteNotification = async (e, id) => {
    e.stopPropagation();
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/notifications/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch {}
  };

  const typeIcon = (type) => {
    if (type === "order") return "🛍️";
    if (type === "review") return "⭐";
    if (type === "message") return "💬";
    return "🔔";
  };

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <nav className="navbar">
      {/* Toggle — ☰ opens, ✕ closes (now first, on the left, like the reference image) */}
      <button
        className="menu-toggle"
        onClick={() => setMenuOpen((prev) => !prev)}
        aria-label={menuOpen ? "Close menu" : "Open menu"}
      >
        {menuOpen ? "✕" : "☰"}
      </button>

      {/* Logo */}
      <div className="logo">
        <Link to="/">BabbaFly 🚀</Link>
      </div>

      {/* Backdrop — dims page behind the open dropdown panel, click to close */}
      <div
        className={`menu-backdrop ${menuOpen ? "show-backdrop" : ""}`}
        onClick={() => setMenuOpen(false)}
      />

      {/* Compact dropdown panel */}
      <div className={`links ${menuOpen ? "show-menu" : ""}`}>
        <Link to="/" className={isActive("/")}>Home</Link>
        <Link to="/listings" className={isActive("/listings")}>Listings</Link>
        <Link to="/categories" className={isActive("/categories")}>Categories</Link>

        {user ? (
          <>
            <Link to="/chat" className={`nav-icon-btn ${isActive("/chat")}`} title="Messages">
              💬 Messages
            </Link>

            <div className="notif-wrapper" ref={dropdownRef}>
              <button
                className="nav-icon-btn bell-btn"
                onClick={handleBellClick}
                title="Notifications"
              >
                🔔 Notifications
                {unreadCount > 0 && (
                  <span className="notif-badge">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {showDropdown && (
                <div className="notif-dropdown">
                  <div className="notif-header">
                    <span>Notifications</span>
                    {notifications.length > 0 && (
                      <button
                        className="notif-clear-btn"
                        onClick={async () => {
                          for (const n of notifications) {
                            try {
                              await axios.delete(
                                `${import.meta.env.VITE_API_URL}/api/notifications/${n._id}`,
                                { headers: { Authorization: `Bearer ${token}` } }
                              );
                            } catch {}
                          }
                          setNotifications([]);
                          setUnreadCount(0);
                        }}
                      >
                        Clear all
                      </button>
                    )}
                  </div>

                  {notifications.length === 0 ? (
                    <div className="notif-empty">No notifications yet</div>
                  ) : (
                    <ul className="notif-list">
                      {notifications.map((notif) => (
                        <li
                          key={notif._id}
                          className={`notif-item ${!notif.read ? "unread" : ""}`}
                          onClick={() => handleNotificationClick(notif)}
                        >
                          <span className="notif-icon">{typeIcon(notif.type)}</span>
                          <div className="notif-body">
                            <p className="notif-title">{notif.title}</p>
                            <p className="notif-msg">{notif.message}</p>
                            <span className="notif-time">{timeAgo(notif.createdAt)}</span>
                          </div>
                          <button
                            className="notif-delete"
                            onClick={(e) => handleDeleteNotification(e, notif._id)}
                            title="Remove"
                          >
                            ✕
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <Link to="/profile" className={isActive("/profile")}>
              👤 {user.name?.split(" ")[0]}
            </Link>
            <Link to="/add-listing" className="sell-btn">+ Sell</Link>
          </>
        ) : (
          <>
            <Link to="/login" className={isActive("/login")}>Login</Link>
            <Link to="/register" className={isActive("/register")}>Register</Link>
            <Link to="/add-listing" className="sell-btn">+ Sell</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;