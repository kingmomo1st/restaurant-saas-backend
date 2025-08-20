import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  clearCart,
  removeFromCart,
  updateItemQuantity,
} from "../redux/cartSlice";
import { Link } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import { firestore } from "../firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import sanityClient from "../sanity/sanityClient.ts";
import imageUrlBuilder from "@sanity/image-url";
import "react-toastify/dist/ReactToastify.css";
import "./css/CartePage.css";

const builder = imageUrlBuilder(sanityClient);
const urlFor = (source) => builder.image(source).url();

function CartPage() {
  const cart = useSelector((state) => state.cart.items);
  const promo = useSelector((state) => state.promo);
  const selectedLocation = useSelector((state) => state.location.selectedLocation);
  const dispatch = useDispatch();

  const [wallpaper, setWallpaper] = useState(null);
  const userEmail = localStorage.getItem("email") || "guest@example.com";

  // Fetch wallpaper for cart page
  useEffect(() => {
    const fetchWallpaper = async () => {
      if (!selectedLocation?._id) return;

      try {
        const res = await sanityClient.fetch(
          `*[_type == "cartPage" && location._ref == "${selectedLocation._id}"][0]{wallpaperImage}`
        );
        setWallpaper(res?.wallpaperImage ? urlFor(res.wallpaperImage) : null);
      } catch (err) {
        console.error("Cart wallpaper fetch failed:", err);
      }
    };

    fetchWallpaper();
  }, [selectedLocation]);

  useEffect(() => {
    const syncCartToFirestore = async () => {
      if (cart.length === 0) return;

      try {
        await setDoc(doc(firestore, "carts", userEmail), {
          email: userEmail,
          items: cart,
          updatedAt: serverTimestamp(),
          checkedOut: false,
        });
      } catch (error) {
        console.error("Error saving cart:", error);
      }
    };

    syncCartToFirestore();
  }, [cart]);

  const calculateTotal = () => {
    const rawTotal = cart.reduce(
      (total, item) =>
        total + (typeof item.price === "number" ? item.price * item.quantity : 0),
      0
    );

    let discount = 0;
    if (promo.code) {
      if (promo.discountType === "percentage") {
        discount = (promo.discountValue / 100) * rawTotal;
      } else if (promo.discountType === "fixed") {
        discount = promo.discountValue;
      }
    }

    return (rawTotal - discount).toFixed(2);
  };

  const handleQuantityChange = (id, size, newQuantity) => {
    if (newQuantity < 1) return;
    dispatch(updateItemQuantity({ id, size, quantity: newQuantity }));
    toast.success("Quantity updated");
  };

  const handleRemoveItem = (id, size) => {
    dispatch(removeFromCart({ id, size }));
    toast.info("Item removed from cart.");
  };

  const handleClearCart = () => {
    dispatch(clearCart());
    toast.warn("Cart cleared.");
  };

  if (cart.length === 0) {
    return (
      <div
        className="empty-cart"
        style={{
          backgroundImage: wallpaper ? `url(${wallpaper})` : "none",
          backgroundSize: "cover",
          backgroundPosition: "center",
          minHeight: "100vh",
          padding: "60px 20px",
        }}
      >
        <h2>Your Cart is empty</h2>
        <Link to="/menu" className="back-to-menu-btn">
          Back to Menu
        </Link>
      </div>
    );
  }

  return (
    <div
      className="cart-page-container"
      style={{
        backgroundImage: wallpaper ? `url(${wallpaper})` : "none",
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "100vh",
      }}
    >
      <ToastContainer />
      <h2>Your Cart</h2>

      <div>
        {cart.map((item) => (
          <div
            key={`${item.id}_${item.size || "default"}`}
            className="cart-item fade-in"
          >
            <img
              src={item.imageURL || "https://via.placeholder.com/150"}
              alt={item.name}
              className="cart-item-image"
            />
            <div className="cart-item-details">
              <h3>
                {item.name} ({item.size || "Regular"})
              </h3>
              {item.modifiers && item.modifiers.length > 0 && (
                <p style={{ fontSize: "0.9rem", color: "#555" }}>
                  Modifiers: {item.modifiers.map((m) => m.name).join(", ")}
                </p>
              )}
              <p>Unit Price: ${item.price.toFixed(2)}</p>

              <div className="quantity-controls">
                <button
                  onClick={() =>
                    handleQuantityChange(item.id, item.size, item.quantity - 1)
                  }
                  disabled={item.quantity === 1}
                >
                  -
                </button>
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) =>
                    handleQuantityChange(
                      item.id,
                      item.size,
                      parseInt(e.target.value)
                    )
                  }
                  min="1"
                />
                <button
                  onClick={() =>
                    handleQuantityChange(item.id, item.size, item.quantity + 1)
                  }
                >
                  +
                </button>
              </div>

              <p>
                <strong>Subtotal:</strong> $
                {(item.price * item.quantity).toFixed(2)}
              </p>
              <button onClick={() => handleRemoveItem(item.id, item.size)}>
                Remove
              </button>
            </div>
          </div>
        ))}

        <div
          className="cart-total"
          style={{ marginTop: "20px", textAlign: "right" }}
        >
          {promo.code && (
            <p className="discount-info" style={{ color: "#2a9d8f" }}>
              Promo <strong>{promo.code}</strong> applied — saved{" "}
              {promo.discountType === "percentage"
                ? `${promo.discountValue}%`
                : `$${promo.discountValue.toFixed(2)}`}
            </p>
          )}
          <h3>Total: ${calculateTotal()}</h3>
          <button onClick={handleClearCart} className="clear-cart-button">
            Clear Cart
          </button>
        </div>

        <Link to="/menu" className="back-to-menu-btn">
          Continue Shopping
        </Link>
        <Link to="/checkout" className="checkout-btn">
          Proceed to Checkout
        </Link>
      </div>
    </div>
  );
}

export default CartPage;