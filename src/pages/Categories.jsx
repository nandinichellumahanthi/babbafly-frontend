import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import API from "../services/api";
import Footer from "../components/Footer";

function Categories() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await API.get("/categories");
      setCategories(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      <Navbar />

      <div className="category-page">
        <h1>Browse Categories</h1>

        <div className="category-grid">
          {categories.map((category) => (
           <div
  key={category._id}
  className="category-card"
 onClick={() => {
  const selectedCategory =
    category.name === "Electronics"
      ? "Accessories"
      : category.name;

  window.location.href =
    `/listings?category=${selectedCategory}`;
}}
>
  <img
    src={
      category.name === "Mobiles"
        ? "https://cdn-icons-png.flaticon.com/512/15/15874.png"
        : "https://cdn-icons-png.flaticon.com/512/3659/3659898.png"
    }
    alt={category.name}
  />

  <h3>{category.name}</h3>
</div> 
          ))}
        </div>
      </div>
      <Footer />
    </>
  );
}

export default Categories;