import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  removeFromCart,
  updateItemQuantity,
  clearCart,
  setOrderType,
} from "../redux/cartSlice";
import "./css/CheckoutPageSalumeria.css";

const CheckoutPage = () => {
  const cartItems = useSelector((state) => state.cart.items);
  const orderType = useSelector((state) => state.cart.orderType);
  const selectedLocation = useSelector((state) => state.location.selectedLocation);
  const selectedFranchise = useSelector((state) => state.franchise.selectedFranchise);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [customerInfo, setCustomerInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    zipCode: "",
    specialInstructions: "",
  });

  const [isLoading, setIsLoading] = useState(false);

  const subtotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  const tax = subtotal * 0.08875;
  const deliveryFee = orderType === "delivery" ? 3.99 : 0;
  const total = subtotal + tax + deliveryFee;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCustomerInfo((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      dispatch(removeFromCart(itemId));
    } else {
      dispatch(updateItemQuantity({ id: itemId, quantity: newQuantity }));
    }
  };

  const handleRemoveItem = (itemId) => {
    dispatch(removeFromCart(itemId));
  };

  const handleOrderTypeChange = (e) => {
    dispatch(setOrderType(e.target.value));
  };

  const handleCheckout = async () => {
    if (!selectedLocation?._id || !selectedFranchise?._id) {
      alert("Please select a location first");
      return;
    }

    const { firstName, lastName, email, phone } = customerInfo;
    if (!firstName || !lastName || !email || !phone) {
      alert("Please fill in all required fields");
      return;
    }

    if (orderType === "delivery") {
      const { address, city, zipCode } = customerInfo;
      if (!address || !city || !zipCode) {
        alert("Please fill in delivery address");
        return;
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:5001/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cart: cartItems,
          userId: null,
          userEmail: customerInfo.email,
          customerInfo: {
            firstName: customerInfo.firstName,
            lastName: customerInfo.lastName,
            phone: customerInfo.phone,
          },
          shippingAddress:
            orderType === "delivery"
              ? {
                  address: customerInfo.address,
                  city: customerInfo.city,
                  state: "NY",
                  zipCode: customerInfo.zipCode,
                }
              : null,
          total: subtotal,
          deliveryFee: deliveryFee,
          taxAmount: tax,
          orderType: orderType,
          locationId: selectedLocation._id,
          franchiseId: selectedFranchise._id,
          promoCode: null,
          redeemPoints: false,
          pointsUsed: 0,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create checkout session");
      }

      const stripe = window.Stripe(
        import.meta.env.VITE_STRIPE_PUBLIC_KEY);

      const { error } = await stripe.redirectToCheckout({
        sessionId: result.id,
      });

      if (error) {
        console.error("Stripe redirect error:", error);
        throw new Error(error.message);
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="salumeria-checkout-container">
        <div className="salumeria-checkout-content">
          <div className="salumeria-empty-cart">
            <span className="salumeria-empty-cart-icon">🛒</span>
            <h2>Your cart is empty</h2>
            <p>Add some delicious items to get started!</p>
            <button
              className="salumeria-continue-shopping-btn"
              onClick={() => navigate("/order-online")}
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="salumeria-checkout-container">
      <div className="salumeria-checkout-content">
        <div className="salumeria-checkout-header">
          <h1>CHECKOUT</h1>
          <p>Review your order and complete your purchase</p>

          <div className="salumeria-order-type-selection">
            <label className={orderType === "pickup" ? "active" : ""}>
              <input
                type="radio"
                name="orderType"
                value="pickup"
                checked={orderType === "pickup"}
                onChange={handleOrderTypeChange}
              />
              <span className="type-icon">🏪</span>
              <span>Pickup</span>
            </label>
            <label className={orderType === "delivery" ? "active" : ""}>
              <input
                type="radio"
                name="orderType"
                value="delivery"
                checked={orderType === "delivery"}
                onChange={handleOrderTypeChange}
              />
              <span className="type-icon">🚚</span>
              <span>Delivery</span>
            </label>
          </div>
        </div>

        <div className="salumeria-checkout-layout">
          <div className="salumeria-checkout-left">
            <div className="salumeria-order-summary">
              <h2>Your Order ({orderType})</h2>
              <div className="salumeria-order-items">
                {cartItems.map((item) => (
                  <div key={item.id} className="salumeria-checkout-item">
                    <div className="salumeria-item-info">
                      <h3>{item.name}</h3>
                      {item.description && <p>{item.description}</p>}
                      <span className="salumeria-item-price">${item.price}</span>
                    </div>
                    <div className="salumeria-item-controls">
                      <div className="salumeria-quantity-controls">
                        <button
                          onClick={() =>
                            handleQuantityChange(item.id, item.quantity - 1)
                          }
                          className="salumeria-qty-btn"
                        >
                          -
                        </button>
                        <span className="salumeria-quantity">{item.quantity}</span>
                        <button
                          onClick={() =>
                            handleQuantityChange(item.id, item.quantity + 1)
                          }
                          className="salumeria-qty-btn"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="salumeria-remove-btn"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="salumeria-customer-info">
              <h2>Contact Information</h2>
              <div className="salumeria-form-grid">
                <div className="salumeria-form-group">
                  <label>First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={customerInfo.firstName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="salumeria-form-group">
                  <label>Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    value={customerInfo.lastName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="salumeria-form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={customerInfo.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="salumeria-form-group">
                  <label>Phone *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={customerInfo.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              {orderType === "delivery" && (
                <>
                  <h3>Delivery Address</h3>
                  <div className="salumeria-form-grid">
                    <div className="salumeria-form-group salumeria-full-width">
                      <label>Street Address *</label>
                      <input
                        type="text"
                        name="address"
                        value={customerInfo.address}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="salumeria-form-group">
                      <label>City *</label>
                      <input
                        type="text"
                        name="city"
                        value={customerInfo.city}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="salumeria-form-group">
                      <label>ZIP Code *</label>
                      <input
                        type="text"
                        name="zipCode"
                        value={customerInfo.zipCode}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="salumeria-form-group salumeria-full-width">
                <label>Special Instructions (Optional)</label>
                <textarea
                  name="specialInstructions"
                  value={customerInfo.specialInstructions}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Any special requests or dietary notes..."
                />
              </div>
            </div>
          </div>

          <div className="salumeria-checkout-right">
            <div className="salumeria-order-total">
              <h2>Order Summary</h2>
              <div className="salumeria-total-breakdown">
                <div className="salumeria-total-line">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="salumeria-total-line">
                  <span>Tax:</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                {orderType === "delivery" && (
                  <div className="salumeria-total-line">
                    <span>Delivery Fee:</span>
                    <span>${deliveryFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="salumeria-total-line salumeria-total-final">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              <div className="salumeria-location-info">
                <p>
                  <strong>Location:</strong> {selectedLocation?.title}
                </p>
                <p>
                  <strong>Order Type:</strong> {orderType}
                </p>
              </div>

              <button
                className="salumeria-checkout-btn"
                onClick={handleCheckout}
                disabled={isLoading}
              >
                {isLoading
                  ? "Processing..."
                  : `Pay $${total.toFixed(2)} with Stripe`}
              </button>

              <button
                className="salumeria-back-btn"
                onClick={() => navigate("/order-online")}
              >
                ← Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;