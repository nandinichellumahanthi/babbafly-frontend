import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import API from "../services/api";
import { useToast } from "../components/Toast";

function AddListing() {
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

  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.price || !formData.category) {
      setError("Title, category and price are required");
      return;
    }

    setLoading(true);

    try {
      await API.post("/listings", {
        ...formData,
        images: [formData.images],
        rating: 5,
      });

      showToast("Listing added successfully! 🎉", "success");
      navigate("/listings");
    } catch (err) {
      console.log(err);
      const msg = "Failed to add listing. Please try again.";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      <div className="auth-page">
        <form className="auth-card" onSubmit={handleSubmit}>
          <h2>Sell Product</h2>

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

          <button className="auth-btn" disabled={loading}>
            {loading ? "Adding..." : "Add Listing"}
          </button>
        </form>
      </div>

      <Footer />
    </>
  );
}

export default AddListing;