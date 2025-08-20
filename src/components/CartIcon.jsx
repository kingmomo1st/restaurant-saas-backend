import React from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import "./css/CartIcon.css";

function CartIcon() {
  const cart = useSelector((state) => state.cart.items);

  return (
    <div className="cart-icon">
      <Link to="/cart" aria-label="View Cart">
        {/* 🛒 Use emoji instead of FontAwesome */}
        <span className="cart-emoji">🛒</span>
        {cart.length > 0 && (
          <span className="cart-count">{cart.length}</span>
        )}
      </Link>
    </div>
  );
}

export default CartIcon;