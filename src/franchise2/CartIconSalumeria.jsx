import React from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import "./css/CartIconSalumeria.css";

const CartIconSalumeria = () => {
  const cartItems = useSelector((state) => state.cart.items);
  const navigate = useNavigate();

  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);
  const totalPrice = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

  const handleCartClick = () => {
    navigate("/checkout");
  };

  if (totalItems === 0) return null;

  return (
    <div className="salumeria-cart-icon-container" onClick={handleCartClick}>
      <div className="salumeria-cart-icon">
        <span className="salumeria-cart-emoji">🛒</span>
        {totalItems > 0 && (
          <div className="salumeria-cart-badge">
            <span className="salumeria-cart-count">{totalItems}</span>
          </div>
        )}
      </div>

      <div className="salumeria-cart-preview">
        <div className="salumeria-cart-preview-header">
          <span className="salumeria-cart-preview-title">Your Cart</span>
        </div>
        <div className="salumeria-cart-preview-total">
          <span className="salumeria-cart-total-price">${totalPrice.toFixed(2)}</span>
          <span className="salumeria-cart-total-items">
            {totalItems} item{totalItems !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="salumeria-cart-preview-action">
          <span className="salumeria-checkout-text">Click to Checkout</span>
        </div>
      </div>
    </div>
  );
};

export default CartIconSalumeria;