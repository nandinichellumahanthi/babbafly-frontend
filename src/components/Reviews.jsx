import { useState, useEffect } from "react";
import axios from "axios";
import "./Review.css";

function Reviews({ listingId }) {
  const [reviews, setReviews] = useState([]);
  const [average, setAverage] = useState(0);
  const [count, setCount] = useState(0);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loadError, setLoadError] = useState(false);

  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const token = localStorage.getItem("token");
  const user = (() => {
    try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
  })();

  useEffect(() => {
    if (listingId) fetchReviews();
  }, [listingId]);

  const fetchReviews = async () => {
    try {
      const res = await axios.get(`${API}/api/reviews/${listingId}`);
      setReviews(res.data.reviews || []);
      setAverage(res.data.average || 0);
      setCount(res.data.count || 0);
      setLoadError(false);
    } catch (err) {
      // Reviews backend not set up yet — hide section gracefully
      setLoadError(true);
    }
  };

  const handleSubmit = async () => {
    if (!token) { setError("Please log in to leave a review."); return; }
    if (rating === 0) { setError("Please select a star rating."); return; }
    if (!comment.trim()) { setError("Please write a comment."); return; }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      await axios.post(
        `${API}/api/reviews/${listingId}`,
        { rating, comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess("Review submitted! ✅");
      setRating(0);
      setComment("");
      fetchReviews();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (reviewId) => {
    try {
      await axios.delete(`${API}/api/reviews/${reviewId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchReviews();
    } catch (err) {
      alert("Failed to delete review.");
    }
  };

  const renderStars = (val, interactive = false) => {
  const displayVal = interactive ? (hoverRating || rating) : val;
  return [1, 2, 3, 4, 5].map((s) => (
    <span
      key={s}
      style={{
        fontSize: interactive ? "2.2rem" : "1.1rem",
        color: s <= displayVal ? "#f59e0b" : "#555",
        cursor: interactive ? "pointer" : "default",
        transition: "color 0.15s, transform 0.1s",
        userSelect: "none",
        marginRight: "3px",
      }}
      onClick={interactive ? () => setRating(s) : undefined}
      onMouseEnter={interactive ? () => setHoverRating(s) : undefined}
      onMouseLeave={interactive ? () => setHoverRating(0) : undefined}
    >
      {s <= displayVal ? "★" : "☆"}
    </span>
  ));
};

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const d = Math.floor(diff / 86400000);
    if (d === 0) return "today";
    if (d === 1) return "yesterday";
    if (d < 30) return `${d} days ago`;
    if (d < 365) return `${Math.floor(d / 30)} months ago`;
    return `${Math.floor(d / 365)} years ago`;
  };

  // If reviews backend isn't set up, hide section silently
  if (loadError) return null;

  return (
    <div className="reviews-section">
      <h3 className="reviews-heading">
        Reviews &amp; Ratings
        {count > 0 && (
          <span className="reviews-summary">
            <span className="reviews-avg">{average}</span>
            <span className="reviews-stars">{renderStars(average)}</span>
            <span className="reviews-count">({count} review{count !== 1 ? "s" : ""})</span>
          </span>
        )}
      </h3>

      {count > 0 && (
        <div className="rating-bars">
          {[5, 4, 3, 2, 1].map((star) => {
            const starCount = reviews.filter((r) => r.rating === star).length;
            const pct = count > 0 ? (starCount / count) * 100 : 0;
            return (
              <div key={star} className="rating-bar-row">
                <span>{star}★</span>
                <div className="rating-bar-track">
                  <div className="rating-bar-fill" style={{ width: `${pct}%` }} />
                </div>
                <span className="rating-bar-count">{starCount}</span>
              </div>
            );
          })}
        </div>
      )}

      {user && (
        <div className="review-form">
          <h4>Leave a Review</h4>
          <div className="star-picker">{renderStars(rating, true)}</div>
          <textarea
            className="review-textarea"
            placeholder="Share your experience with this listing..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
            rows={3}
          />
          <div className="review-form-footer">
            <span className="char-count">{comment.length}/500</span>
            <button className="review-submit-btn" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
          </div>
          {error && <p className="review-error">{error}</p>}
          {success && <p className="review-success">{success}</p>}
        </div>
      )}

      {reviews.length === 0 ? (
        <p className="reviews-empty">No reviews yet. Be the first to review!</p>
      ) : (
        <ul className="reviews-list">
          {reviews.map((review) => (
            <li key={review._id} className="review-item">
              <div className="review-top">
                <div className="review-avatar">
                  {review.userId?.name?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div className="review-meta">
                  <span className="review-author">{review.userId?.name || "User"}</span>
                  <div className="review-stars">{renderStars(review.rating)}</div>
                  <span className="review-date">{timeAgo(review.createdAt)}</span>
                </div>
                {user && review.userId?._id === (user.id || user._id) && (
                  <button className="review-delete-btn" onClick={() => handleDelete(review._id)} title="Delete review">
                    🗑️
                  </button>
                )}
              </div>
              <p className="review-comment">{review.comment}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Reviews;