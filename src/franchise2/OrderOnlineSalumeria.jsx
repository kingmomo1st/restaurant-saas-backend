import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { addToCart, setOrderType } from "../redux/cartSlice";
import sanityClient from "../sanity/sanityClient";
import imageUrlBuilder from "@sanity/image-url";
import "./css/OrderOnlineSalumeria.css";
import CartIconSalumeria from "./CartIconSalumeria"

const builder = imageUrlBuilder(sanityClient);
const urlFor = (source) => builder.image(source).url();

const OrderOnlineSalumeria = () => {
  const selectedLocation = useSelector((state) => state.location.selectedLocation);
  const selectedCategory = useSelector((state) => state.categoryFilter.selectedCategory);
  const orderMethod = useSelector((state) => state.cart.orderType);
  const dispatch = useDispatch();

  const [orderPageData, setOrderPageData] = useState(null);
  const [menuData, setMenuData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedLocation?._id) return;

      try {
        setLoading(true);

        const orderPage = await sanityClient.fetch(
          `*[_type == "orderOnlineSalumeria" && location._ref == $locId][0]{
            title,
            navigationNotice,
            backgroundImage
          }`,
          { locId: selectedLocation._id }
        );

        const elegantMenu = await sanityClient.fetch(
          `*[_type == "elegantMenuSalumeria" && location._ref == $locId][0]{
            staticMenuSections[]{
              categoryTitle,
              items[]{
                name,
                description,
                price
              }
            }
          }`,
          { locId: selectedLocation._id }
        );

        setOrderPageData(orderPage);
        setMenuData(elegantMenu);
      } catch (err) {
        console.error("Order page fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedLocation]);

  const handleOrderType = (e) => {
    dispatch(setOrderType(e.target.value));
  };

  const handleAddToCart = (item) => {
    dispatch(
      addToCart({
        id: item.name.replace(/\s+/g, "-").toLowerCase(),
        name: item.name,
        price: item.price || 0,
        quantity: 1,
        description: item.description,
      })
    );
  };

  if (loading) return <div className="order-loading">Loading menu…</div>;

  return (
    
    <div className="order-salumeria-container">
     
      {/* Background image layer */}
      {orderPageData?.backgroundImage && (
        <div
          className="order-background-image"
          style={{
            backgroundImage: `url(${urlFor(orderPageData.backgroundImage)})`,
          }}
        />
      )}
      <CartIconSalumeria />
      <div className="order-content">
        <div className="order-header">
          <h1>{orderPageData?.title || "ORDER ONLINE"}</h1>
          <p>{orderPageData?.navigationNotice || "Fresh Italian classics, delivered or ready for pickup."}</p>

          <div className="order-toggle">
          
            <label className={orderMethod === "pickup" ? "active" : ""}>
              <input
                type="radio"
                name="orderMethod"
                value="pickup"
                checked={orderMethod === "pickup"}
                onChange={handleOrderType}
              />
              <span className="toggle-icon">🏪</span>
              <span>Pickup</span>
            </label>
            <label className={orderMethod === "delivery" ? "active" : ""}>
              <input
                type="radio"
                name="orderMethod"
                value="delivery"
                checked={orderMethod === "delivery"}
                onChange={handleOrderType}
              />
              <span className="toggle-icon">🚚</span>
              <span>Delivery</span>
            </label>
          </div>
        </div>

        <div className="order-menu-sections">
          {menuData?.staticMenuSections?.map((section, idx) => (
            <div key={idx} className="order-menu-section">
              <h2 className="order-section-title">{section.categoryTitle}</h2>
              <div className="order-menu-grid">
                {section.items?.map((item, itemIdx) => (
                  <div key={itemIdx} className="order-menu-item">
                    <div className="order-item-content">
                      <div className="order-item-header">
                        <h3 className="order-item-name">{item.name}</h3>
                        {item.price && (
                          <span className="order-item-price">${item.price}</span>
                        )}
                      </div>
                      {item.description && (
                        <p className="order-item-description">{item.description}</p>
                      )}
                    </div>
                    <button 
                      className="order-add-button" 
                      onClick={() => handleAddToCart(item)}
                    >
                      Add to Cart
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="order-navigation">
          <Link to="/menu" className="order-nav-button secondary">
            ← Back to Menu
          </Link>
          <Link to="/" className="order-nav-button primary">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderOnlineSalumeria;