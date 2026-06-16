import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import API from "../services/api";

function EditListing() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    price: "",
    location: "",
    images: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }
    fetchListing();
  }, [id]);

  const fetchListing = async () => {
    try {
      const res = await API.get(`/listings/${id}`);
      const l = res.data;
      setFormData({
        title: l.title || "",
        description: l.description || "",
        category: l.category || "",
        price: l.price || "",
        location: l.location || "",
        images: l.images?.[0] || "",
      });
    } catch (err) {
      setError("Failed to load listing.");
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.price || !formData.category) {
      setError("Title, category and price are required.");
      return;
    }
    setLoading(true);
    try {
      await API.put(`/listings/${id}`, {
        ...formData,
        images: [formData.images],
      });
      navigate(`/listing/${id}`);
    } catch (err) {
      setError("Failed to update listing. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <>
        <Navbar />
        <h1 style={{ textAlign: "center", marginTop: "120px" }}>Loading...</h1>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="auth-page">
        <form className="auth-card" onSubmit={handleSubmit}>
          <h2>✏️ Edit Listing</h2>

          {error && <p className="auth-error">{error}</p>}

          <input
            name="title"
            placeholder="Product Title"
            value={formData.title}
            onChange={handleChange}
          />

          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
          >
            <option value="">Select Category</option>
            <option value="Mobile">Mobile</option>
            <option value="Laptop">Laptop</option>
            <option value="Tablet">Tablet</option>
            <option value="Accessories">Accessories</option>
          </select>

          <input
            name="price"
            type="number"
            placeholder="Price (₹)"
            value={formData.price}
            onChange={handleChange}
          />

          <input
            name="location"
            placeholder="Location"
            value={formData.location}
            onChange={handleChange}
          />

          <input
            name="images"
            placeholder="Image URL"
            value={formData.images}
            onChange={handleChange}
          />

          <textarea
            name="description"
            placeholder="Description"
            value={formData.description}
            onChange={handleChange}
          />

          <div style={{ display: "flex", gap: "12px" }}>
            <button
              type="button"
              className="auth-btn"
              style={{ background: "#888" }}
              onClick={() => navigate(`/listing/${id}`)}
            >
              Cancel
            </button>
            <button className="auth-btn" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
      <Footer />
    </>
  );
}

export default EditListing;