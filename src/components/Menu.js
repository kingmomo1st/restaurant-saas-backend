import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { firestore } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { useDispatch } from "react-redux";
import { addToCart as reduxAddToCart } from "../redux/cartSlice";
import { toast } from "react-toastify";
import Layout from "./Layout";
import "./css/Menu.css";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

function Menu() {
  const dispatch = useDispatch();
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedSizes, setSelectedSizes] = useState({});
  const query = useQuery();

  useEffect(() => {
    const categoryFromQuery = query.get("category");
    if (categoryFromQuery) {
      setSelectedCategory(categoryFromQuery.charAt(0).toUpperCase() + categoryFromQuery.slice(1));
    }
  }, [query]);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const menuSnapshot = await getDocs(collection(firestore, "MenuItems"));
        const menuList = menuSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMenuItems(menuList);
      } catch (error) {
        console.error("Error fetching menu items:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);

  const handleAddToCart = (item) => {
    const itemSize = selectedSizes[item.id] || null;

    if (item.category.toLowerCase() === "wines" && (!item.price || typeof item.price !== "number")) {
      toast.error("Please choose Glass or Bottle.");
      return;
    }

    if (item.category.toLowerCase() === "pizza" && item.sizes?.length && !itemSize) {
      toast.error("Please select a size first.");
      return;
    }

    let finalPrice = item.price;
    if (item.category.toLowerCase() === "pizza" && itemSize) {
      const selectedSizeObj = item.sizes.find((s) => s.name === itemSize);
      finalPrice = selectedSizeObj?.price || item.price;
    }

    dispatch(reduxAddToCart({
      ...item,
      price: finalPrice,
      size: itemSize,
    }));
    toast.success(`${item.name} added to cart!`);
  };

  const filteredItems =
    selectedCategory === "All"
      ? menuItems
      : menuItems.filter(
          (item) => item.category.toLowerCase() === selectedCategory.toLowerCase()
        );

  if (loading) return <div className="menu-loading">Loading menu...</div>;

  return (
    <Layout>
      <div className="menu-container">
        <h2 className="menu-heading">Our Menu</h2>

        <div className="category-filters">
          {["All", "Appetizers", "Pasta", "Desserts", "Pizza", "Wines"].map((category) => (
            <button
              key={category}
              className={`filter-btn ${selectedCategory === category ? "active" : ""}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="menu-grid">
          {filteredItems.map((item) => (
            <div key={item.id} className="menu-card">
              <img src={item.imageURL || "https://via.placeholder.com/150"} alt={item.name} className="menu-image" />
              <h3>{item.name}</h3>
              <p className="menu-category">Category: {item.category}</p>
              <p className="menu-description">{item.description}</p>

              {item.category.toLowerCase() === "wines" ? (
                <div>
                  <p>Glass: ${item.priceGlass?.toFixed(2) || "N/A"}</p>
                  <p>Bottle: ${item.priceBottle?.toFixed(2) || "N/A"}</p>
                  <button onClick={() => handleAddToCart({ ...item, price: item.priceGlass, size: "Glass" })} className="btn menu-btn">
                    Add Glass
                  </button>
                  <button onClick={() => handleAddToCart({ ...item, price: item.priceBottle, size: "Bottle" })} className="btn menu-btn">
                    Add Bottle
                  </button>
                </div>
              ) : (
                <>
                  {item.category.toLowerCase() === "pizza" && item.sizes?.length > 0 && (
                    <select
                      value={selectedSizes[item.id] || ""}
                      onChange={(e) => setSelectedSizes({ ...selectedSizes, [item.id]: e.target.value })}
                      className="pizza-size-dropdown"
                    >
                      <option value="">Select Size</option>
                      {item.sizes.map((size) => (
                        <option key={size.name} value={size.name}>
                          {size.name} - ${size.price.toFixed(2)}
                        </option>
                      ))}
                    </select>
                  )}
                  <p className="menu-price">
                    {typeof item.price === "number" ? `$${item.price.toFixed(2)}` : "Select Size"}
                  </p>
                  <button onClick={() => handleAddToCart(item)} className="btn menu-btn">
                    Add to Cart
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}

export default Menu;